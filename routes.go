package principia

import (
	"controllers"
	"controllers/api"
	"controllers/simulator"
	"controllers/user"
	"lib/gorilla/mux"
	"net/http"
)

func init() {
	// Set up the gorilla mux router
	router := mux.NewRouter().StrictSlash(true)
	http.Handle("/", router)

	// Handle unspecified routes with 404 handler
	router.NotFoundHandler = http.HandlerFunc(controllers.NotFoundHandler)

	// Simple dormant pages
	router.HandleFunc("/", controllers.HomeHandler)
	router.HandleFunc("/about", controllers.AboutHandler)
	router.HandleFunc("/faqs", controllers.FaqsHandler)
	router.HandleFunc("/feedback", controllers.FeedbackHandler)
	router.HandleFunc("/help", controllers.HelpHandler)

	// Simulators
	router.HandleFunc("/simulator", simulator.BrowseHandler)
	router.HandleFunc("/simulator/browse", simulator.BrowseHandler)
	router.HandleFunc("/simulator/kinematics", simulator.NewKinematicsHandler)
	router.HandleFunc("/simulator/kinematics/{simulationID:[0-9]+}", simulator.EditKinematicsHandler)

	router.HandleFunc("/simulator/layout", controllers.LayoutHandler)

	// User pages
	router.HandleFunc("/user/{userID:[0-9]+}", user.ProfileHandler)
	router.HandleFunc("/user/{userID:[0-9]+}/simulations", user.SimulationsHandler)
	router.HandleFunc("/user/{userID:[0-9]+}/interactions", user.InteractionsHandler)

	// API Endpoint (Returns JSON)
	router.HandleFunc("/api/simulator/{simulationID:[0-9]+}/comments", api.CommentHandler)
	router.HandleFunc("/api/simulator/{simulationID:[0-9]+}/ratings", api.RatingHandler)

	// TODO: Make simulations returned in browse, the list of user simulations, the list
	//       of user's ratings, and the list of user's comments be api calls
	//router.HandleFunc("/api/simulator/browse", api.CommentHandler)
	//router.HandleFunc("/api/user/{simulationID:[0-9]+}/simulations", api.UserSimulationsHandler)
	//router.HandleFunc("/api/user/{simulationID:[0-9]+}/comments", api.UserCommentCHandler)
	//router.HandleFunc("/api/user/{simulationID:[0-9]+}/ratings", api.UserRatingsHandler)

	// Test pages
	router.HandleFunc("/test/{testPage:[a-z]+}", controllers.TestHandler)
}
