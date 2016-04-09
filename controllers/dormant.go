package controllers

import (
	"appengine/datastore"
	"controllers/utils"
	"lib/gorilla/mux"
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

func HelpHandler(w http.ResponseWriter, r *http.Request) {
	BaseHandler(w, r, "dormant/help", nil)
}

func TestHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	page := vars["testPage"]

	BaseHandler(w, r, "test/"+page, nil)
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: filter out when CreationDate is older than 7 days (when we have lots of users)
	// TODO: Order by the number of ratings objects each simulation has... In order to do this,
	//       we're going to have to keep a running total of a simulations score everytime a
	//       rating is given (Rating object is created or deleted). So whenever a rating object
	//       is created or deleted, the simulation object will have to be modified...
	//       I don't think we can filter Simulations by the number of children entities it has :(
	q := datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Order("-CreationDate").Limit(8)

	simulations, err := utils.GetSimulationDataSlice(r, q)
	if err != nil {
		ErrorHandler(w, "Error getting top simulations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"simulations": simulations,
	}

	BaseHandler(w, r, "dormant/home", data)
}
