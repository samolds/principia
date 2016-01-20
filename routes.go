package principia

import (
	"controllers"
	"lib/gorilla/mux"
	"net/http"
)

func init() {

	// Set up the gorilla mux router
	router := mux.NewRouter().StrictSlash(true)
	http.Handle("/", router)

	router.HandleFunc("/", controllers.HomeHandler)
	router.HandleFunc("/simulator", controllers.NewSimulatorHandler)
	router.HandleFunc("/simulator/all", controllers.AllSimulatorHandler)
	router.HandleFunc("/simulator/{simulatorId}", controllers.EditSimulatorHandler)

	// API Endpoint (Returns JSON)
	router.HandleFunc("/simulator/{simulatorId}/comments", controllers.CommentHandler)

	// Get all simulations tied to a specific user
	router.HandleFunc("/simulator/user/{userId}", controllers.UserSimulatorHandler)

	router.HandleFunc("/about", controllers.AboutHandler)
	router.HandleFunc("/faqs", controllers.FaqsHandler)
	router.HandleFunc("/feedback", controllers.FeedbackHandler)
	router.HandleFunc("/comment", controllers.CommentHandler)
}
