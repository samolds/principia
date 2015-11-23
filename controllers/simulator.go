package controllers

import (
	"appengine"
	"appengine/user"
	"lib/gorilla/mux"
	"log"
	"models"
	"net/http"
)

func NewSimulatorHandler(w http.ResponseWriter, r *http.Request) {

	c := appengine.NewContext(r)
	u := user.Current(c)
	var simulation models.Simulation

	if r.Method == "GET" {

		// New simulation
		if u == nil { // Not Logged In
			simulation = models.Simulation{Name: "", Contents: ""}
		} else { // Logged In
			simulation = models.Simulation{Name: "", UserID: u.ID, Contents: ""}
		}

	} else if r.Method == "POST" {

		// Posting new simulation to the datastore
		newID := "1"
		simulation = models.Simulation{Name: r.FormValue("Name"), UserID: u.ID, SimulationID: newID, Contents: r.FormValue("Contents")}

		log.Println("NAME: " + r.FormValue("Name"))
		log.Println("UserID: " + u.ID)
		log.Println("SimulationID: " + newID)
		log.Println("Contents: " + r.FormValue("Contents"))

		// AJAX will prevent a redirect..
		http.Redirect(w, r, "/simulator/"+newID, http.StatusFound)
		return
	}

	data := map[string]interface{}{
		"sim": simulation,
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
		// Grab it from the datastore
		// UserID could be different than user trying to access the simulation
		simulation = models.Simulation{Name: "EXISTING SIMULATION", UserID: "1", SimulationID: simId, Contents: "EXISTING SIMULATION"}

	} else if r.Method == "POST" {

		// Posting existing simulation to datastore
		// Should only be updating the Name AND/OR Contents
		simulation = models.Simulation{Name: r.FormValue("Name"), UserID: u.ID, SimulationID: simId, Contents: r.FormValue("Contents")}

	}

	data := map[string]interface{}{
		"sim": simulation,
	}

	baseHandler(w, r, "simulator", data)

}
