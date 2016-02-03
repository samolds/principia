package controllers

import (
	"appengine"
	"appengine/datastore"
	"lib/gorilla/mux"
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

func TestHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	page := vars["testPage"]

	BaseHandler(w, r, "test/"+page, nil)
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := appengine.NewContext(r)
	q := datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Order("-CreationDate").Limit(10) // TODO: filter out when CreationDate is older than 7 days and Order by rating

	var simulations []models.Simulation
	_, err := q.GetAll(ctx, &simulations)

	if err != nil {
		ErrorHandler(w, err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"simulations": simulations,
	}

	BaseHandler(w, r, "dormant/home", data)
}
