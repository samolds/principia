package controllers

import (
  "html/template"
  "net/http"
)

var tmplDir = "views/"
var baseName = "base"
var base = tmplDir + baseName + ".html"


var homeTmpl = template.Must(template.New("home").ParseFiles(base, tmplDir + "home.html"))
var simulatorTmpl = template.Must(template.New("simulations").ParseFiles(base, tmplDir + "simulator.html"))
var aboutTmpl = template.Must(template.New("about").ParseFiles(base, tmplDir + "about.html"))
var faqsTmpl = template.Must(template.New("faqs").ParseFiles(base, tmplDir + "faqs.html"))
var feedbackTmpl = template.Must(template.New("feedback").ParseFiles(base, tmplDir + "feedback.html"))
var loginTmpl = template.Must(template.New("login").ParseFiles(base, tmplDir + "login.html"))


func HomeHandler(w http.ResponseWriter, r *http.Request) {
  homeTmpl.ExecuteTemplate(w, baseName, nil)
}

func SimulatorHandler(w http.ResponseWriter, r *http.Request) {
  simulatorTmpl.ExecuteTemplate(w, baseName, nil)
}

func AboutHandler(w http.ResponseWriter, r *http.Request) {
  aboutTmpl.ExecuteTemplate(w, baseName, nil)
}

func FaqsHandler(w http.ResponseWriter, r *http.Request) {
  faqsTmpl.ExecuteTemplate(w, baseName, nil)
}

func FeedbackHandler(w http.ResponseWriter, r *http.Request) {
  feedbackTmpl.ExecuteTemplate(w, baseName, nil)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
  loginTmpl.ExecuteTemplate(w, baseName, nil)
}
