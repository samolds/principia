package api

import (
	"appengine"
	"appengine/datastore"
	"controllers/utils"
	"encoding/json"
	"lib/gorilla/mux"
	"models"
	"net/http"
	"strconv"
	"time"
)

// Can be caught by JQuery ".fail()" function and be used to display
// a notification on the front end of the error.
//
// Just returns an error code and message. Doesn't try to render an
// entire template
func ApiErrorResponse(w http.ResponseWriter, err string, code int) {
	http.Error(w, err, code)
}

// GET returns JSON all comments associated with the simulationID passed in the url
// POST saves the comment to datastore with the simulationID as the ancestor key
func CommentHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	simKeyName := vars["simulationID"]

	ctx := appengine.NewContext(r)
	simulationKey := datastore.NewKey(ctx, "Simulation", simKeyName, 0, nil)

	if r.Method == "GET" {
		var comments []models.Comment
		q := datastore.NewQuery("Comment").Ancestor(simulationKey).Order("-CreationDate")
		_, err := q.GetAll(ctx, &comments)

		if err != nil {
			ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Return comments as json
		json.NewEncoder(w).Encode(comments)
	}

	if r.Method == "POST" {
		user, err := utils.GetCurrentUser(ctx)
		if err != nil {
			ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Get an ID as a simulation descendant
		key, keyName := utils.GenerateUniqueKey(ctx, "Comment", user, simulationKey)

		// Build the comment object
		comment := models.Comment{
			KeyName:       keyName,
			AuthorKeyName: user.KeyName,
			Contents:      r.FormValue("Contents"),
			CreationDate:  time.Now(),
		}

		// Put the comment in the datastore
		_, err = datastore.Put(ctx, key, &comment)

		if err != nil {
			ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}

// GET returns JSON all ratings associated with the simulationID passed in the url
// POST saves the rating to datastore with the simulationID as the ancestor key
func RatingHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	simKeyName := vars["simulationID"]

	ctx := appengine.NewContext(r)
	simulationKey := datastore.NewKey(ctx, "Simulation", simKeyName, 0, nil)

	var ratings []models.Rating
	q := datastore.NewQuery("Rating").Ancestor(simulationKey).Order("-CreationDate")
	_, err := q.GetAll(ctx, &ratings)

	if err != nil {
		ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if r.Method == "GET" {
		totalScore := 0
		for i := 0; i < len(ratings); i++ {
			totalScore += int(ratings[i].Score)
		}

		// Return comments as json
		json.NewEncoder(w).Encode(struct {
			Ratings    []models.Rating
			TotalScore int
		}{
			Ratings:    ratings,
			TotalScore: totalScore,
		})
	}

	if r.Method == "POST" {
		user, err := utils.GetCurrentUser(ctx)
		if err != nil {
			ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}

		for i := 0; i < len(ratings); i++ {
			if user.KeyName == ratings[i].AuthorKeyName {
				ratingsKey := datastore.NewKey(ctx, "Rating", ratings[i].KeyName, 0, simulationKey)

				if err != nil {
					ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
					return
				}

				datastore.Delete(ctx, ratingsKey)
				return
			}
		}

		// Get an ID as a simulation descendant
		key, keyName := utils.GenerateUniqueKey(ctx, "Rating", user, simulationKey)

		score, err := strconv.ParseInt(r.FormValue("Score"), 10, 8)
		if err != nil {
			ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Build the comment object
		rating := models.Rating{
			KeyName:       keyName,
			AuthorKeyName: user.KeyName,
			Score:         int8(score),
			CreationDate:  time.Now(),
		}

		// Put the comment in the datastore
		_, err = datastore.Put(ctx, key, &rating)

		if err != nil {
			ApiErrorResponse(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}
}
