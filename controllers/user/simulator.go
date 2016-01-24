package user

import (
	"appengine"
	"appengine/datastore"
	"controllers"
	"lib/gorilla/mux"
	"models"
	"net/http"
)

// Returns all simulations tied to the user id passed in the url
func AllSimulationsHandler(w http.ResponseWriter, r *http.Request) {
	// Grab the userId
	vars := mux.Vars(r)
	userId := vars["userId"]

	limit := 10
	simulations := make([]models.Simulation, limit)

	// Get the current context
	c := appengine.NewContext(r)

	// TODO: Only show public simulations if NOT THE OWNER is trying to view
	q := datastore.NewQuery("Simulation").Filter("UserID =", userId)
	keys, err := q.GetAll(c, &simulations)

	if err != nil {
		controllers.ErrorHandler(w, "Could not load user simulations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for i := 0; i < len(keys); i++ {
		simulations[i].Id = keys[i].IntID()
	}

	data := map[string]interface{}{
		"sims": simulations,
	}

	controllers.BaseHandler(w, r, "user/allSimulations", data)
}

func UserProfileHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		
	}
	controllers.BaseHandler(w, r, "user/profile", data)
}
