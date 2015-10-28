package controllers

import (
	"bytes"
	"html/template"
	"io"
	"net/http"
)

var (
	tmplDir  = "views/"
	baseName = "base"
	base     = tmplDir + baseName + ".html"

	templates = map[string]*template.Template{
		"simulator": template.Must(template.ParseFiles(base, tmplDir+"simulator.html")),
		"about":     template.Must(template.ParseFiles(base, tmplDir+"about.html")),
		"faqs":      template.Must(template.ParseFiles(base, tmplDir+"faqs.html")),
		"feedback":  template.Must(template.ParseFiles(base, tmplDir+"feedback.html")),
		"error":     template.Must(template.ParseFiles(base, tmplDir+"error.html")),
	}
)

type UserT struct {
	ID   int
	Name string
}

type PageData struct {
	User UserT
	Data map[string]interface{}
}

func validPath(path string, name string) bool {
	if path == "/" { // && name == "home" {
		return true
	} else if path == "/simulator" { // temporary while simulator IS home page
		return false
	} else {
		_, ok := templates[name]
		return ok && path == "/"+name
	}
}

func errorHandler(w http.ResponseWriter, buffer *bytes.Buffer, errMsg string, status int) {
	buffer.Reset()
	w.WriteHeader(status)

	data := map[string]interface{}{
		"title":  status,
		"errMsg": errMsg,
	}
	err := templates["error"].ExecuteTemplate(buffer, baseName, data)

	if err != nil {
		buffer.Reset()
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}

	io.Copy(w, buffer)
}

func baseHandler(w http.ResponseWriter, r *http.Request, templ string, data map[string]interface{}) {
	var buffer bytes.Buffer

	if !validPath(r.URL.Path, templ) {
		errorHandler(w, &buffer, "Not Found!", http.StatusNotFound)
		return
	}

	pageData := &PageData{
		User: UserT{ID: 1, Name: "Test User"},
		Data: data,
	}

	err := templates[templ].ExecuteTemplate(&buffer, baseName, pageData)
	if err != nil {
		errorHandler(w, &buffer, err.Error(), http.StatusInternalServerError)
		return
	}

	io.Copy(w, &buffer)
}
