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
	userKeyName := vars["userID"]

	// TODO: Only show public simulations if NOT THE OWNER is trying to view
	q := datastore.NewQuery("Simulation").Filter("AuthorKeyName =", userKeyName)

	simulations, err := utils.BuildSimulationDataSlice(r, q)
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
// TODO: Show whomever's profile is trying to be viewed by userKeyName, not by GetCurrentUser
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userKeyName := vars["userID"]

	ctx := appengine.NewContext(r)
	pageUserKey := datastore.NewKey(ctx, "User", userKeyName, 0, nil)

	if r.Method == "GET" {
		var user models.User
		err := datastore.Get(ctx, pageUserKey, &user)
		if err != nil {
			controllers.ErrorHandler(w, "User was not found: "+err.Error(), http.StatusNotFound)
			return
		}
	}

	if r.Method == "POST" {
		activeUser, err := utils.GetCurrentUser(ctx)

		if err != nil {
			controllers.ErrorHandler(w, "Could not load user: "+err.Error(), http.StatusInternalServerError)
			return
		}

		activeUserKey := datastore.NewKey(ctx, "User", activeUser.KeyName, 0, nil)

		if !pageUserKey.Equal(activeUserKey) {
			controllers.ErrorHandler(w, "Unauthorized update attempt: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Update
		activeUser.DisplayName = r.FormValue("DisplayName")
		activeUser.Interests = r.FormValue("Interests")

		// Put the user in the datastore
		_, err = datastore.Put(ctx, activeUserKey, &activeUser)

		if err != nil {
			// Could not place the user in the datastore
			controllers.ErrorHandler(w, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	controllers.BaseHandler(w, r, "user/profile", nil)
}
