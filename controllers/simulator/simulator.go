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

// Returns simulations saved in the datastore
func BrowseHandler(w http.ResponseWriter, r *http.Request) {
	q := datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Order("-Name").Limit(20)
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

		// Create the simulation object
		creationTime := time.Now()
		simulation = models.Simulation{
			KeyName:       keyName,
			Name:          formValues["Name"][0],
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

	// The autosaved thumbnail images need to be POSTed to specific appengine blobstore "action" paths.
	// Have to specify a path to return to after the post succeeds
	imageUploadUrl, err := blobstore.UploadURL(ctx, r.URL.Path, nil)
	if err != nil {
		controllers.ErrorHandler(w, r, "Could not generate blobstore upload: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// If it's a new simulation, you're the owner
	data := map[string]interface{}{
		"simulation":     simulation,
		"imageUploadUrl": imageUploadUrl.Path,
		"new":            true,
		"isOwner":        true,
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

		// Update the simulation with new values, including the new thumbnail image key
		simulation.Name = formValues["Name"][0]
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

		// Delete the simulation in the datastore
		err = datastore.Delete(ctx, simulationKey)

		if err != nil {
			// Could not place the simulation in the datastore
			api.ApiErrorResponse(w, "Could not delete existing simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		return
	}

	// The autosaved thumbnail images need to be POSTed to specific appengine blobstore "action" paths.
	// Have to specify a path to return to after the post succeeds
	imageUploadUrl, err := blobstore.UploadURL(ctx, r.URL.Path, nil)
	if err != nil {
		controllers.ErrorHandler(w, r, "Could not generate blobstore upload: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"simulation":     simulationData,
		"imageUploadUrl": imageUploadUrl.Path,
		"new":            false,
		"isOwner":        isOwner,
	}

	controllers.BaseHandler(w, r, template, data)
}

func NewKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	newGenericHandler(w, r, "kinematics", "simulator/kinematics")
}

func EditKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	editGenericHandler(w, r, "kinematics", "simulator/kinematics")
}
