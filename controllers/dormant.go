package controllers

import (
	"appengine"
	"appengine/datastore"
	"models"
	"net/http"
)

func AboutHandler(w http.ResponseWriter, r *http.Request) {
	BaseHandler(w, r, "dormant/about", nil)
}

func FaqsHandler(w http.ResponseWriter, r *http.Request) {
	BaseHandler(w, r, "dormant/faqs", nil)
}

func FeedbackHandler(w http.ResponseWriter, r *http.Request) {
	BaseHandler(w, r, "dormant/feedback", nil)
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	limit := 10
	simulations := make([]models.Simulation, 0, limit)

	c := appengine.NewContext(r)
	q := datastore.NewQuery("Simulation").Order("-CreationDate").Limit(limit) // TODO: filter out when CreationDate is older than 7 days
	keys, err := q.GetAll(c, &simulations)

	if err != nil {
		ErrorHandler(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i := 0; i < len(keys); i++ {
		simulations[i].Id = keys[i].IntID()
	}

	data := map[string]interface{}{
		"topSimulations": simulations,
	}

	BaseHandler(w, r, "dormant/home", data)
}
