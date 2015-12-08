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

	// This is the correct way to handle a 404 error with gorilla mux..
	// http://stackoverflow.com/questions/9996767/showing-custom-404-error-page-with-standard-http-package
	// https://medium.com/@matryer/the-http-handlerfunc-wrapper-technique-in-golang-c60bf76e6124#.x29aysovx
	//router.NotFoundHandler = http.HandlerFunc(controllers.ERRRRRR)
}
