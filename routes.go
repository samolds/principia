package principia

import (
	"net/http"

  "controllers"
)

func init() {
  http.HandleFunc("/", controllers.HomeHandler)
  http.HandleFunc("/simulator", controllers.SimulatorHandler)
  http.HandleFunc("/browse", controllers.BrowseHandler)
  http.HandleFunc("/about", controllers.AboutHandler)
  http.HandleFunc("/faqs", controllers.FaqsHandler)
  http.HandleFunc("/feedback", controllers.FeedbackHandler)
  http.HandleFunc("/login", controllers.LoginHandler)
}
