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

// Returns simulations tied to the user id passed in the url
func SimulationsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	pageUserKeyName := vars["userID"]
	ctx := appengine.NewContext(r)

	// Get the page user information
	var pageUser models.User
	pageUserKey := datastore.NewKey(ctx, "User", pageUserKeyName, 0, nil)
	err := datastore.Get(ctx, pageUserKey, &pageUser)
	if err != nil {
		controllers.ErrorHandler(w, "User was not found: "+err.Error(), http.StatusNotFound)
		return
	}

	// Check to see if the logged in user matches the page user
	userIsOwner := utils.IsOwner(pageUserKeyName, ctx)

	// Build a query to get the 50 most recent simulations that belong to the user
	q := datastore.NewQuery("Simulation").Filter("AuthorKeyName =", pageUserKeyName)
	if !userIsOwner { // Only get public simulations if the pageUser is not the logged in user
		q = q.Filter("IsPrivate =", false)
	}
	q = q.Order("-CreationDate").Limit(50)

	// Get the simulations for the page user from the query
	var simulations []utils.SimulationData
	simulations, err = utils.GetSimulationDataSlice(r, q)
	if err != nil {
		controllers.ErrorHandler(w, "Could not load user simulations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"user":        pageUser,
		"simulations": simulations,
		"userIsOwner": userIsOwner,
	}

	controllers.BaseHandler(w, r, "user/simulations", data)
}

// Returns simulations favorited by and comments from the user id passed in the url
func InteractionsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userKeyName := vars["userID"]
	ctx := appengine.NewContext(r)
	var simulations []utils.SimulationData
	var comments []utils.CommentData

	// Check to see if the page user is the same as the logged in user
	userIsOwner := utils.IsOwner(userKeyName, ctx)

	// Only get favorited and commented information if it's the proper user
	// Don't display interaction data to any user except for the user who owns it
	if userIsOwner {
		// Get 50 of the most recent ratings made by the logged in user
		var ratingKeys []*datastore.Key
		var ratingObjs []models.Rating
		q := datastore.NewQuery("Rating").KeysOnly().Filter("AuthorKeyName =", userKeyName).Order("-CreationDate").Limit(50)
		ratingKeys, err := q.GetAll(ctx, ratingObjs)

		// Get the parent keys of the ratings made (these are the keys of the simulations the ratings were for)
		var simRateKeys []*datastore.Key
		for _, key := range ratingKeys {
			simRateKeys = append(simRateKeys, key.Parent())
		}

		// Get all of the simulation objects from the simulation keys
		simulationRateObjs := make([]models.Simulation, len(simRateKeys))
		err = datastore.GetMulti(ctx, simRateKeys, simulationRateObjs)
		if err != nil {
			controllers.ErrorHandler(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Build the proper simulation data objects from the simulation models
		simulations, err = utils.BuildSimulationDataSlice(ctx, simulationRateObjs)
		if err != nil {
			controllers.ErrorHandler(w, "Could not load user simulations: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Get 50 of the most recent comments made by the logged in user
		q = datastore.NewQuery("Comment").Filter("AuthorKeyName =", userKeyName).Order("-CreationDate").Limit(50)
		comments, err = utils.GetCommentDataSlice(r, q)
		if err != nil {
			controllers.ErrorHandler(w, "Error fetching comments: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	data := map[string]interface{}{
		"simulations": simulations,
		"comments":    comments,
		"userIsOwner": userIsOwner,
	}

	controllers.BaseHandler(w, r, "user/interactions", data)
}

// Displays a users profile page and handles updates to a logged in users profile information
func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userKeyName := vars["userID"]
	ctx := appengine.NewContext(r)

	// Get the page user information
	var pageUser models.User
	pageUserKey := datastore.NewKey(ctx, "User", userKeyName, 0, nil)
	err := datastore.Get(ctx, pageUserKey, &pageUser)
	if err != nil {
		controllers.ErrorHandler(w, "User was not found: "+err.Error(), http.StatusNotFound)
		return
	}

	// Check to see if the logged in user matches the page user
	userIsOwner := utils.IsOwner(userKeyName, ctx)

	// If a user is just viewing the page
	if r.Method == "GET" {
		var simulations []utils.SimulationData

		// If viewing someone else's profile page, get their 8 most recent public simultions to display
		if !userIsOwner {
			// Build a query
			q := datastore.NewQuery("Simulation").Filter("AuthorKeyName =", userKeyName).Filter("IsPrivate =", false).Order("-CreationDate").Limit(8)
			simulations, err = utils.GetSimulationDataSlice(r, q)
			if err != nil {
				controllers.ErrorHandler(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		data := map[string]interface{}{
			"user":        pageUser,
			"userIsOwner": userIsOwner,
			"simulations": simulations,
		}

		controllers.BaseHandler(w, r, "user/profile", data)
		return
	}

	// When a user tries to post information
	if r.Method == "POST" {
		// Make sure only the owner is trying to update the information
		if !userIsOwner {
			controllers.ErrorHandler(w, "Unauthorized update attempt: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Update user information
		pageUser.DisplayName = r.FormValue("DisplayName")
		pageUser.Interests = r.FormValue("Interests")

		_, err = datastore.Put(ctx, pageUserKey, &pageUser)
		if err != nil {
			// Could not place the user in the datastore
			controllers.ErrorHandler(w, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}
}
