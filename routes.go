package principia

import (
	"net/http"

	"controllers"
)

func init() {
	http.HandleFunc("/", controllers.SimulatorHandler)
	http.HandleFunc("/about", controllers.AboutHandler)
	http.HandleFunc("/faqs", controllers.FaqsHandler)
	http.HandleFunc("/feedback", controllers.FeedbackHandler)
	http.HandleFunc("/comment", controllers.CommentHandler)
}
