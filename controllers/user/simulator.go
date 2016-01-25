package user

import (
	"appengine"
	"appengine/datastore"
	"appengine/user"
	"controllers"
	"lib/gorilla/mux"
	"models"
	"net/http"
	"time"
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
	if r.Method == "POST" {

		c := appengine.NewContext(r)
	  u := user.Current(c)

		// Construct the simulations key
		key := datastore.NewKey(c, "User", u.ID, 0, nil)

		var pUser models.User

		pUser.Email = u.Email
		pUser.ID = u.ID
		pUser.Admin = u.Admin
		pUser.DisplayName = r.FormValue("DisplayName")
		pUser.Interests = r.FormValue("Interests")
		pUser.JoinDate = time.Now()

		// Put the user in the datastore
		_, err := datastore.Put(c, key, &pUser)

		if err != nil {
			// Could not place the user in the datastore
			controllers.ErrorHandler(w, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
			return
		}

	}

	data := map[string]interface{}{}
	controllers.BaseHandler(w, r, "user/profile", data)
}
