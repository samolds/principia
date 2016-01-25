package api

import (
	"appengine"
	"appengine/datastore"
	"appengine/user"
	"controllers"
	"controllers/utils"
	"encoding/json"
	"lib/gorilla/mux"
	"log"
	"models"
	"net/http"
	"time"
)

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
			controllers.ErrorHandler(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Return comments as json
		json.NewEncoder(w).Encode(comments)
	}

	if r.Method == "POST" {
		u := user.Current(c)

		if u == nil {
			log.Println("CANNOT POST COMMENT WHEN NOT LOGGED IN")
			return
		}

		// Update simulation contents
		comment := models.Comment{UserID: u.ID, Contents: r.FormValue("Contents"), Date: time.Now(), SimulationID: id}

		// Construct the simulations key
		key := datastore.NewIncompleteKey(c, "Comment", simulationKey(c, id))

		// Put the simulation in the datastore
		_, err := datastore.Put(c, key, &comment)

		if err != nil {
			controllers.ErrorHandler(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

// Returns the key for a given simulation in the datastore
// Used to set ancestor keys when persisting comments
func simulationKey(c appengine.Context, simId int64) *datastore.Key {
	return datastore.NewKey(c, "Simulation", "", simId, nil)
}
