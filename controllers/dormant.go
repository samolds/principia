package controllers

import (
	"appengine/datastore"
	"controllers/utils"
	"lib/gorilla/mux"
	"models"
	"net/http"
	"sort"
	"time"
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
	topThisMonth := true

	// Get a time value for one month ago
	oneMonthAgo := time.Now().AddDate(0, -1, 0)

	// Get all of the public simulations from the last month // TODO: Too expensive of a call?
	q := datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Filter("CreationDate >", oneMonthAgo)
	simulations, err := utils.GetSimulationDataSlice(r, q)
	if err != nil {
		ErrorHandler(w, r, "Error getting top simulations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Sort the simulations by the the ones with the most favorites
	sort.Sort(models.ByRating(simulations))

	// Only keep the first 8
	if len(simulations) > 8 {
		simulations = simulations[0:8]
	}

	// If there were none created this month, just get the 8 most recent simulations
	if len(simulations) == 0 {
		topThisMonth = false
		q = datastore.NewQuery("Simulation").Filter("IsPrivate =", false).Order("-CreationDate").Limit(8)
		simulations, err = utils.GetSimulationDataSlice(r, q)
		if err != nil {
			ErrorHandler(w, r, "Error getting recent simulations: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	data := map[string]interface{}{
		"simulations":  simulations,
		"topThisMonth": topThisMonth,
	}

	BaseHandler(w, r, "dormant/home", data)
}
