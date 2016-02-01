package user

import (
	"appengine"
	"appengine/datastore"
	"controllers"
	"controllers/utils"
	"lib/gorilla/mux"
	"models"
	"net/http"
)

// Returns all simulations tied to the user id passed in the url
func SimulationsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]
	ctx := appengine.NewContext(r)

	// TODO: Only show public simulations if NOT THE OWNER is trying to view
	q := datastore.NewQuery("Simulation").Filter("AuthorKey =", userID)
	var simulations []models.Simulation
	_, err := q.GetAll(ctx, &simulations)

	if err != nil {
		controllers.ErrorHandler(w, "Could not load user simulations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"simulations": simulations,
	}

	controllers.BaseHandler(w, r, "user/simulations", data)
}

// Handles Posts from Profile Page
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["userID"]
	pageUserKey, err := datastore.DecodeKey(userID)
	ctx := appengine.NewContext(r)

	if r.Method == "GET" {
		var user models.User
		err = datastore.Get(ctx, pageUserKey, &user)
		if err != nil {
			controllers.ErrorHandler(w, "User was not found: "+err.Error(), http.StatusNotFound)
			return
		}
	}

	if r.Method == "POST" {
		user, err := utils.GetCurrentUser(ctx)

		if err != nil {
			// Could not place the user in the datastore
			controllers.ErrorHandler(w, "Could not load user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		activeUserKey, err := datastore.DecodeKey(user.KeyID)

		if err != nil {
			// Could not place the user in the datastore
			controllers.ErrorHandler(w, "Could not load user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		if !pageUserKey.Equal(activeUserKey) {
			controllers.ErrorHandler(w, "Unauthorized update attempt: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Update
		user.DisplayName = r.FormValue("DisplayName")
		user.Interests = r.FormValue("Interests")

		// Put the user in the datastore
		_, err = datastore.Put(ctx, activeUserKey, &user)

		if err != nil {
			// Could not place the user in the datastore
			controllers.ErrorHandler(w, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	controllers.BaseHandler(w, r, "user/profile", nil)
}
