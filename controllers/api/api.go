package api

import (
	"appengine"
	"appengine/datastore"
	"appengine/user"
	"controllers/utils"
	"encoding/json"
	"lib/gorilla/mux"
	"models"
	"net/http"
	"time"
)

// Can be caught by JQuery ".fail()" function and be used to display
// a notification on the front end of the error.
//
// Just returns an error code and message. Doesn't try to render an
// entire template
func apiErrorResponse(w http.ResponseWriter, err string, code int) {
  http.Error(w, err, code)
}

// GET returns JSON all comments associated with the simId passed in the url
// POST saves the comment to datastore with the simId as the ancestor key
func CommentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	simId := vars["simulatorId"]
	c := appengine.NewContext(r)
	id := utils.StringToInt64(simId)

	if r.Method == "GET" {
		comments := make([]models.Comment, 0, 10)

		q := datastore.NewQuery("Comment").Ancestor(simulationKey(c, id)).Order("-Date")
		_, err := q.GetAll(c, &comments)

		if err != nil {
			apiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Return comments as json
		json.NewEncoder(w).Encode(comments)
	}

	if r.Method == "POST" {
		u := user.Current(c)

		if u == nil {
			apiErrorResponse(w, "Cannot post comment when not logged in", http.StatusInternalServerError)
			return
		}

		// Update simulation contents
		comment := models.Comment{UserID: u.ID, Contents: r.FormValue("Contents"), Date: time.Now(), SimulationID: id}

		// Construct the simulations key
		key := datastore.NewIncompleteKey(c, "Comment", simulationKey(c, id))

		// Put the comment in the datastore
		_, err := datastore.Put(c, key, &comment)

		if err != nil {
			apiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

// Returns the key for a given simulation in the datastore
// Used to set ancestor keys when persisting comments
func simulationKey(c appengine.Context, simId int64) *datastore.Key {
	return datastore.NewKey(c, "Simulation", "", simId, nil)
}
