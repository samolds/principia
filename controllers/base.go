package controllers

import (
	"appengine"
	"appengine/user"
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
		"home":            template.Must(template.ParseFiles(base, tmplDir+"home.html")),
		"usersimulations": template.Must(template.ParseFiles(base, tmplDir+"mysimulations.html")),
		"simulator":       template.Must(template.ParseFiles(base, tmplDir+"simulator.html")),
		"about":           template.Must(template.ParseFiles(base, tmplDir+"about.html")),
		"faqs":            template.Must(template.ParseFiles(base, tmplDir+"faqs.html")),
		"feedback":        template.Must(template.ParseFiles(base, tmplDir+"feedback.html")),
		"error":           template.Must(template.ParseFiles(base, tmplDir+"error.html")),
	}
)

type PageData struct {
	CurrentUser *user.User
	Data        map[string]interface{}
}

func validPath(path string, name string) bool {
	return true
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

	// USER AUTHENTICATION
	c := appengine.NewContext(r)
	u := user.Current(c)
	var url string
	var loginMessage string

	if u == nil {
		tmpURL, _ := user.LoginURL(c, "/")
		url = tmpURL
		loginMessage = "Sign In"
	} else {
		tmpURL, _ := user.LogoutURL(c, "/")
		url = tmpURL
		loginMessage = "Sign Out"
	}

	if data == nil {
		data = map[string]interface{}{}
	}

	data["loginUrl"] = url
	data["loginMessage"] = loginMessage

	pageData := &PageData{
		CurrentUser: u,
		Data:        data,
	}

	err := templates[templ].ExecuteTemplate(&buffer, baseName, pageData)
	if err != nil {
		errorHandler(w, &buffer, err.Error(), http.StatusInternalServerError)
		return
	}

	io.Copy(w, &buffer)
}
