package controllers

import (
  "html/template"
  "net/http"
)


var (
  tmplDir = "views/"
  baseName = "base"
  base = tmplDir + baseName + ".html"

  templates = map[string]*template.Template{
    "home": template.Must(template.ParseFiles(base, tmplDir + "home.html")),
    "simulator": template.Must(template.ParseFiles(base, tmplDir + "simulator.html")),
    "browse": template.Must(template.ParseFiles(base, tmplDir + "browse.html")),
    "about": template.Must(template.ParseFiles(base, tmplDir + "about.html")),
    "faqs": template.Must(template.ParseFiles(base, tmplDir + "faqs.html")),
    "feedback": template.Must(template.ParseFiles(base, tmplDir + "feedback.html")),
    "login": template.Must(template.ParseFiles(base, tmplDir + "login.html")),
  }
)


func validPath(path string, name string) bool {
  if path == "/" && name == "home" {
    return true
  } else {
    _, ok := templates[name]
    return ok && path == "/" + name
  }
}


func errorHandler(w http.ResponseWriter, r *http.Request, status int, err string) {
  w.WriteHeader(status)
  http.Error(w, err, status)
}


func baseHandler(w http.ResponseWriter, r *http.Request, templ string, data map[string]interface{}) {
  if !validPath(r.URL.Path, templ) {
    errorHandler(w, r, http.StatusNotFound, "Not Found!")
    return
  }

  err := templates[templ].ExecuteTemplate(w, baseName, data)
  if err != nil {
    errorHandler(w, r, http.StatusInternalServerError, err.Error())
    return
  }
}
