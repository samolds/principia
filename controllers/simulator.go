package controllers

import (
	"appengine"
	"appengine/datastore"
	"appengine/user"
	"lib/gorilla/mux"
	"log"
	"models"
	"net/http"
	"strconv"
)

func NewSimulatorHandler(w http.ResponseWriter, r *http.Request) {

	c := appengine.NewContext(r)
	u := user.Current(c)
	var simulation models.Simulation

	if r.Method == "GET" {

		if u != nil { // Logged In
			simulation = models.Simulation{Name: "", UserID: u.ID, Contents: ""}
		} else { // Not Logged In
			simulation = models.Simulation{Name: "", UserID: "", Contents: ""}
		}

	} else if r.Method == "POST" {

		// Create the simulation object
		simulation = models.Simulation{Name: r.FormValue("Name"), UserID: u.ID, Contents: r.FormValue("Contents")}

		// Give it a new incomplete key with the author of the simulation set as the ancestor key
		// Datastore will define a simulation id for us
		key := datastore.NewIncompleteKey(c, "Simulation", nil)

		// Put the simulation in the datastore and retrieve the now complete key in result
		result, err := datastore.Put(c, key, &simulation)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Grab the simulation id from the result key generated by the put
		simId := strconv.FormatInt(result.IntID(), 10)

		// an AJAX Request would prevent a redirect..
		http.Redirect(w, r, "/simulator/"+simId, http.StatusFound)

		return

	}

	// If it's a new simulation, you're the owner
	data := map[string]interface{}{
		"sim": simulation,
		"isOwner": true,
	}

	baseHandler(w, r, "simulator", data)

}

func EditSimulatorHandler(w http.ResponseWriter, r *http.Request) {

	vars := mux.Vars(r)
	simId := vars["simulatorId"]
	c := appengine.NewContext(r)
	u := user.Current(c)
	var simulation models.Simulation

	if r.Method == "GET" {

		// Existing Simulation
		id := StringToInt64(simId)

		// Construct the simulations key
		k := datastore.NewKey(c, "Simulation", "", id, nil)

		if err := datastore.Get(c, k, &simulation); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// TODO: Handle empty simulation here?

	} else if r.Method == "POST" {

		// Posting existing simulation to datastore
		id := StringToInt64(simId)

		// Construct the simulations key
		key := datastore.NewKey(c, "Simulation", "", id, nil)

		// Update simulation contents
		simulation = models.Simulation{Name: r.FormValue("Name"), UserID: u.ID, Contents: r.FormValue("Contents")}

		// Put the simulation in the datastore
		_, err := datastore.Put(c, key, &simulation)

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

	}

	simulation.Id = StringToInt64(simId)

	data := map[string]interface{}{
		"sim":     simulation,
		"isOwner": isOwner(simulation.UserID, u),
	}

	baseHandler(w, r, "simulator", data)

}

func UserSimulatorHandler(w http.ResponseWriter, r *http.Request) {

	// Grab the user
	c := appengine.NewContext(r)
	u := user.Current(c)

	q := datastore.NewQuery("Simulation").Filter("UserID =", u.ID)
	simulations := make([]models.Simulation, 0, 10)

	keys, err := q.GetAll(c, &simulations)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	for i := 0; i < len(simulations); i++ {
		simulations[i].Id = keys[i].IntID()
	}

	data := map[string]interface{}{
		"sims": simulations,
	}

	baseHandler(w, r, "usersimulations", data)

}

func StringToInt64(s string) int64 {

	result, dontcare := strconv.ParseInt(s, 10, 64)

	if dontcare != nil {
		log.Println(dontcare.Error())
	}

	return result

}

func isOwner(simUserId string, u *user.User) bool {

	if u == nil {
		return false
	}

	return simUserId == u.ID

}
