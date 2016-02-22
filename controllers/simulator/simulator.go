package simulator

import (
	"appengine"
	"appengine/datastore"
	"controllers"
	"controllers/utils"
	"lib/gorilla/mux"
	"models"
	"net/http"
	"time"
)

// Returns simulations saved in the datastore
func BrowseHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	q := datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Order("-Name").Limit(20)

	var simulations []models.Simulation
	_, err := q.GetAll(ctx, &simulations)

	if err != nil {
		controllers.ErrorHandler(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"simulations": simulations,
	}

	controllers.BaseHandler(w, r, "simulator/browse", data)
}

// GET returns a new simulation which the current user is made owner of (if logged in)
// POST saves the simulation and redirects to simulator/{simulationID}
func newGenericHandler(w http.ResponseWriter, r *http.Request, simType string, template string) {
	ctx := appengine.NewContext(r)

	var simulation models.Simulation

	if r.Method == "POST" {
		user, err := utils.GetCurrentUser(ctx)

		if err != nil {
			controllers.ErrorHandler(w, "Couldn't get current user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		key, keyName := utils.GenerateUniqueKey(ctx, "Simulation", user, nil)

		// Create the simulation object
		creationTime := time.Now()
		simulation = models.Simulation{
			KeyName:       keyName,
			Name:          r.FormValue("Name"),
			Simulator:     r.FormValue("Contents"),
			Type:          simType,
			CreationDate:  creationTime,
			UpdatedDate:   creationTime,
			IsPrivate:     utils.StringToBool(r.FormValue("IsPrivate")),
			AuthorKeyName: user.KeyName,
		}

		// Put the simulation in the datastore
		key, err = datastore.Put(ctx, key, &simulation)

		if err != nil {
			controllers.ErrorHandler(w, "Could not save new simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		pagePath := r.URL.Path + "/" + simulation.KeyName

		// an AJAX Request would prevent a redirect..
		http.Redirect(w, r, pagePath, http.StatusFound)
		return
	}

	// If it's a new simulation, you're the owner
	data := map[string]interface{}{
		"simulation": simulation,
		"isOwner":    true,
		"isExistingSim": false,
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
		controllers.ErrorHandler(w, "Simulation was not found: "+err.Error(), http.StatusNotFound)
		return
	}

	if r.Method == "POST" {
		simulation.Name = r.FormValue("Name")
		simulation.Simulator = r.FormValue("Contents")
		simulation.IsPrivate = utils.StringToBool(r.FormValue("IsPrivate"))
		simulation.UpdatedDate = time.Now()

		// Put the simulation in the datastore
		_, err = datastore.Put(ctx, simulationKey, &simulation)

		if err != nil {
			// Could not place the simulation in the datastore
			controllers.ErrorHandler(w, "Could not save existing simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// an AJAX Request would prevent a redirect..
		http.Redirect(w, r, r.URL.Path, http.StatusFound)
		return
	}

	if r.Method == "DELETE" {
		// Delete the simulation in the datastore
		err = datastore.Delete(ctx, simulationKey)

		if err != nil {
			// Could not place the simulation in the datastore
			controllers.ErrorHandler(w, "Could not delete existing simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	isOwner := utils.IsOwner(simulation.AuthorKeyName, ctx)
	authorKey := datastore.NewKey(ctx, "User", simulation.AuthorKeyName, 0, nil)

	var author models.User
	err = datastore.Get(ctx, authorKey, &author)

	authorDisplay := author.Email
	if author.DisplayName != "" {
		authorDisplay = author.DisplayName
	}

	data := map[string]interface{}{
		"simulation":              simulation,
		"simulationAuthor":        author,
		"simulationAuthorDisplay": authorDisplay,
		"isOwner":                 isOwner,
		"isExistingSim":           true,
	}

	controllers.BaseHandler(w, r, template, data)
}

func NewSandboxHandler(w http.ResponseWriter, r *http.Request) {
	newGenericHandler(w, r, "sandbox", "simulator/sandbox")
}

func EditSandboxHandler(w http.ResponseWriter, r *http.Request) {
	editGenericHandler(w, r, "sandbox", "simulator/sandbox")
}

func NewKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	newGenericHandler(w, r, "kinematics", "simulator/kinematics")
}

func EditKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	editGenericHandler(w, r, "kinematics", "simulator/kinematics")
}
