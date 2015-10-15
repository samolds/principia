package controllers

import (
  "net/http"
)


func AboutHandler(w http.ResponseWriter, r *http.Request) {
  baseHandler(w, r, "about", nil)
}


func FaqsHandler(w http.ResponseWriter, r *http.Request) {
  baseHandler(w, r, "faqs", nil)
}


func FeedbackHandler(w http.ResponseWriter, r *http.Request) {
  baseHandler(w, r, "feedback", nil)
}
