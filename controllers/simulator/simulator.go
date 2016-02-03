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
func newGenericHandler(w http.ResponseWriter, r *http.Request, simType string, uri string, template string) {
	ctx := appengine.NewContext(r)

	var simulation models.Simulation

	if r.Method == "POST" {
		user, err := utils.GetCurrentUser(ctx)

		if err != nil {
			controllers.ErrorHandler(w, "Couldn't get current user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		key, err := utils.GenerateUniqueKey(ctx, "Simulation", user.KeyID, nil)

		if err != nil {
			controllers.ErrorHandler(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Create the simulation object
		creationTime := time.Now()
		simulation = models.Simulation{
			KeyID:        key.Encode(),
			Name:         r.FormValue("Name"),
			Simulator:    r.FormValue("Contents"),
			Type:         simType,
			CreationDate: creationTime,
			UpdatedDate:  creationTime,
			IsPrivate:    utils.StringToBool(r.FormValue("IsPrivate")),
			AuthorKey:    user.KeyID,
		}

		// Put the simulation in the datastore
		key, err = datastore.Put(ctx, key, &simulation)

		if err != nil {
			controllers.ErrorHandler(w, "Could not save new simulation: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// an AJAX Request would prevent a redirect..
		http.Redirect(w, r, uri+simulation.KeyID, http.StatusFound)

		return
	}

	// If it's a new simulation, you're the owner
	data := map[string]interface{}{
		"simulation": simulation,
		"isOwner":    true,
	}

	controllers.BaseHandler(w, r, template, data)
}

// GET returns simulation as specified by the simulationID passed in the url
// POST saves the simulation as specified by the simulationID passed in the url
func editGenericHandler(w http.ResponseWriter, r *http.Request, simType string, template string) {
	vars := mux.Vars(r)
	simID := vars["simulationID"]
	simulationKey, err := datastore.DecodeKey(simID)

	if err != nil {
		controllers.ErrorHandler(w, "Invalid Simulation ID: "+err.Error(), http.StatusInternalServerError)
		return
	}

	ctx := appengine.NewContext(r)
	var simulation models.Simulation

	err = datastore.Get(ctx, simulationKey, &simulation)
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
	}

	isOwner := utils.IsOwner(simulation.AuthorKey, ctx)

	data := map[string]interface{}{
		"simulation": simulation,
		"isOwner":    isOwner,
	}

	controllers.BaseHandler(w, r, template, data)
}

func NewSandboxHandler(w http.ResponseWriter, r *http.Request) {
	newGenericHandler(w, r, "sandbox", "/simulator/sandbox/", "simulator/sandbox")
}

func EditSandboxHandler(w http.ResponseWriter, r *http.Request) {
	editGenericHandler(w, r, "sandbox", "simulator/sandbox")
}

func NewKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	newGenericHandler(w, r, "kinematics", "/simulator/kinematics/", "simulator/kinematics")
}

func EditKinematicsHandler(w http.ResponseWriter, r *http.Request) {
	editGenericHandler(w, r, "kinematics", "simulator/kinematics")
}
