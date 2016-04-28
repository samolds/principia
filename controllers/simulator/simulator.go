package simulator

import (
	"appengine"
	"appengine/blobstore"
	"appengine/datastore"
	appengineImage "appengine/image"
	"bytes"
	"controllers"
	"controllers/api"
	"controllers/utils"
	"io"
	"lib/gorilla/mux"
	"models"
	"net/http"
	"time"
)

// Generates an image upload url for the blobstore and returns it as a string
func GetBlobstoreUploadPath(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	_, err := utils.GetCurrentUser(ctx)
	if err != nil {
		// No user found, need to be logged in to save a simulation
		api.ApiErrorResponse(w, "You need to be logged in.", http.StatusInternalServerError)
		return
	}

	vars := mux.Vars(r)
	keyName, ok := vars["simulationID"]

	returnPath := "/simulator/kinematics"
	if ok { // Trying to save to an existing simulation
		/* Is the security check worth the datastore query?
		   simulationKey := datastore.NewKey(ctx, "Simulation", keyName, 0, nil)

		   // Get the simulation from the datastore to check if the user is the owner
		   var simulation models.Simulation
		   err := datastore.Get(ctx, simulationKey, &simulation)
		   if err != nil {
		     api.ApiErrorResponse(w, "Simulation was not found: "+err.Error(), http.StatusNotFound)
		     return
		   }

		   // Make sure the logged in user is the owner
		   isOwner := utils.IsOwner(simulation.AuthorKeyName, ctx)
		   if !isOwner {
		     return;
		   }
		*/

		returnPath = returnPath + "/" + keyName
	}

	// The autosaved thumbnail images need to be POSTed to specific appengine blobstore "action" paths.
	// Have to specify a path to return to after the post succeeds
	imageUploadUrl, err := blobstore.UploadURL(ctx, returnPath, nil)
	if err != nil {
		api.ApiErrorResponse(w, "Could not generate blobstore upload: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Need to return the uploadUrl to use to post the image to
	uploadUrl := bytes.NewBufferString(imageUploadUrl.Path)
	io.Copy(w, uploadUrl)
	return
}

// Returns simulations saved in the datastore
func BrowseHandler(w http.ResponseWriter, r *http.Request) {
	q := datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Order("-CreationDate").Limit(100)
	simulations, err := utils.GetSimulationDataSlice(r, q)
	if err != nil {
		controllers.ErrorHandler(w, r, err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"simulations": simulations,
	}

	controllers.BaseHandler(w, r, "simulator/browse", data)
}

// GET returns an empty simulation object
// POST saves the simulation and redirects to simulator/{simulationID}
func newGenericHandler(w http.ResponseWriter, r *http.Request, simType string, template string) {
	ctx := appengine.NewContext(r)

	var simulation models.Simulation

	if r.Method == "POST" {
		user, err := utils.GetCurrentUser(ctx)

		if err != nil {
			controllers.ErrorHandler(w, r, "Couldn't get current user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		key, keyName := utils.GenerateUniqueKey(ctx, "Simulation", user, nil)

		// Get all of the form values and blob image from the post
		blobs, formValues, err := blobstore.ParseUpload(r)
		if err != nil {
			controllers.ErrorHandler(w, r, "Bad blobstore form parse: "+err.Error(), http.StatusInternalServerError)
			return
		}

		simulationName := formValues["Name"][0]
		if len(simulationName) > 50 || len(simulationName) == 0 {
			api.ApiErrorResponse(w, "Simulation Name must not be empty and must be shorter than 50 characters.", http.StatusInternalServerError)
			return
		}

		// Create the simulation object
		creationTime := time.Now()
		simulation = models.Simulation{
			KeyName:       keyName,
			Name:          simulationName,
			Simulator:     formValues["Contents"][0],
			Type:          simType,
			Description:   formValues["Description"][0],
			CreationDate:  creationTime,
			UpdatedDate:   creationTime,
			IsPrivate:     utils.StringToBool(formValues["IsPrivate"][0]),
			AuthorKeyName: user.KeyName,
			ImageBlobKey:  blobs["Thumbnail"][0].BlobKey,
		}

		// Put the simulation in the datastore
		key, err = datastore.Put(ctx, key, &simulation)

		if err != nil {
			controllers.ErrorHandler(w, r, "Could not save new simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		pagePath := r.URL.Path + "/" + simulation.KeyName
		// an AJAX Request would prevent a redirect.
		// http.Redirect(w, r, pagePath, http.StatusFound)

		// The logic that allows posting an image generated from a canvas as FormData
		// requires that the POST is asynchronous? So post back what the redirect should be
		pagePathBuff := bytes.NewBufferString(pagePath)
		io.Copy(w, pagePathBuff)
		return
	}

	// If it's a new simulation, you're the owner
	data := map[string]interface{}{
		"simulation": simulation,
		"new":        true,
		"isOwner":    true,
	}

	controllers.BaseHandler(w, r, template, data)
}

// GET returns simulation as specified by the simulationID passed in the url
// POST saves the simulation as specified by the simulationID passed in the url
func editGenericHandler(w http.ResponseWriter, r *http.Request, simType string, template string) {
	vars := mux.Vars(r)
	keyName := vars["simulationID"]

	ctx := appengine.NewContext(r)
	simulationKey := datastore.NewKey(ctx, "Simulation", keyName, 0, nil)

	var simulation models.Simulation
	err := datastore.Get(ctx, simulationKey, &simulation)
	if err != nil {
		controllers.ErrorHandler(w, r, "Simulation was not found: "+err.Error(), http.StatusNotFound)
		return
	}

	simulationData, err := utils.BuildSimulationData(ctx, simulation, simulationKey)
	if err != nil {
		controllers.ErrorHandler(w, r, "Simulation was not found: "+err.Error(), http.StatusNotFound)
		return
	}

	isOwner := utils.IsOwner(simulation.AuthorKeyName, ctx)
	if r.Method == "POST" && isOwner {
		// Get all of the form values and blob image from the post
		blobs, formValues, err := blobstore.ParseUpload(r)
		if err != nil {
			api.ApiErrorResponse(w, "Bad blobstore form parse: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Delete the url displaying the old thumbnail image in the blobstore
		err = appengineImage.DeleteServingURL(ctx, simulation.ImageBlobKey)
		if err != nil {
			api.ApiErrorResponse(w, "Can't delete the image's serving URL: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Delete the old thumbnail image in the blobstore
		err = blobstore.Delete(ctx, simulation.ImageBlobKey)
		if err != nil {
			api.ApiErrorResponse(w, "Can't delete the blobstore image: "+err.Error(), http.StatusInternalServerError)
			return
		}

		simulationName := formValues["Name"][0]
		if len(simulationName) > 50 || len(simulationName) == 0 {
			api.ApiErrorResponse(w, "Simulation Name must not be empty and must be shorter than 50 characters.", http.StatusInternalServerError)
			return
		}

		// Update the simulation with new values, including the new thumbnail image key
		simulation.Name = simulationName
		simulation.Simulator = formValues["Contents"][0]
		simulation.Description = formValues["Description"][0]
		simulation.IsPrivate = utils.StringToBool(formValues["IsPrivate"][0])
		simulation.ImageBlobKey = blobs["Thumbnail"][0].BlobKey
		simulation.UpdatedDate = time.Now()

		// Put the simulation in the datastore
		_, err = datastore.Put(ctx, simulationKey, &simulation)

		if err != nil {
			// Could not place the simulation in the datastore
			api.ApiErrorResponse(w, "Could not save existing simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// an AJAX Request would prevent a redirect..
		http.Redirect(w, r, r.URL.Path, http.StatusFound)
		return
	}

	if r.Method == "DELETE" && isOwner {
		// Delete the url displaying the old thumbnail image in the blobstore
		err = appengineImage.DeleteServingURL(ctx, simulation.ImageBlobKey)
		if err != nil {
			api.ApiErrorResponse(w, "Can't delete the image's serving URL: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Delete the old thumbnail image in the blobstore
		err = blobstore.Delete(ctx, simulation.ImageBlobKey)
		if err != nil {
			api.ApiErrorResponse(w, "Can't delete the blobstore image: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Delete the simulation's comments in the datastore
		var emptyCommentObjs []models.Comment
		comQ := datastore.NewQuery("Comment").Ancestor(simulationKey).KeysOnly()
		commentKeys, err := comQ.GetAll(ctx, &emptyCommentObjs)
		err = datastore.DeleteMulti(ctx, commentKeys)
		if err != nil {
			api.ApiErrorResponse(w, "Could not delete simulations comments: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Delete the simulation's ratings in the datastore
		var emptyRatingObjs []models.Rating
		ratQ := datastore.NewQuery("Rating").Ancestor(simulationKey).KeysOnly()
		ratingKeys, err := ratQ.GetAll(ctx, &emptyRatingObjs)
		err = datastore.DeleteMulti(ctx, ratingKeys)
		if err != nil {
			api.ApiErrorResponse(w, "Could not delete simulations ratings: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Delete the simulation in the datastore
		err = datastore.Delete(ctx, simulationKey)

		if err != nil {
			// Could not place the simulation in the datastore
			api.ApiErrorResponse(w, "Could not delete existing simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		return
	}

	data := map[string]interface{}{
		"simulation": simulationData,
		"new":        false,
		"isOwner":    isOwner,
	}

	controllers.BaseHandler(w, r, template, data)
}

func NewKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	newGenericHandler(w, r, "kinematics", "simulator/kinematics")
}

func EditKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	editGenericHandler(w, r, "kinematics", "simulator/kinematics")
}
