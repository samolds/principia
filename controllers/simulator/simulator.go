package simulator

import (
	"appengine"
	"appengine/datastore"
	"controllers"
	"controllers/api"
	"controllers/utils"
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

		// Create the simulation object
		creationTime := time.Now()
		simulation = models.Simulation{
			KeyName:       keyName,
			Name:          r.FormValue("Name"),
			Simulator:     r.FormValue("Contents"),
			Type:          simType,
			Description:   r.FormValue("Description"),
			CreationDate:  creationTime,
			UpdatedDate:   creationTime,
			IsPrivate:     utils.StringToBool(r.FormValue("IsPrivate")),
			AuthorKeyName: user.KeyName,
		}

		// Put the simulation in the datastore
		key, err = datastore.Put(ctx, key, &simulation)

		if err != nil {
			controllers.ErrorHandler(w, r, "Could not save new simulation: "+err.Error(), http.StatusInternalServerError)
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
		simulation.Name = r.FormValue("Name")
		simulation.Simulator = r.FormValue("Contents")
		simulation.Description = r.FormValue("Description")
		simulation.IsPrivate = utils.StringToBool(r.FormValue("IsPrivate"))
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
