package controllers

import (
	"appengine"
	"appengine/user"
	"bytes"
	"html/template"
	"io"
	"net/http"
	"models"
	"appengine/datastore"
	"time"
)

var (
	tmplDir = "views/"
	dormDir = tmplDir + "dormant/"
	simDir  = tmplDir + "simulator/"
	userDir = tmplDir + "user/"

	simFrag = simDir + "simulator.frag.html"
	comFrag = simDir + "comments.frag.html"

	baseName = "base"
	base     = tmplDir + baseName + ".html"

	templates = map[string]*template.Template{
		"dormant/home":     template.Must(template.ParseFiles(base, dormDir+"home.html")),
		"dormant/about":    template.Must(template.ParseFiles(base, dormDir+"about.html")),
		"dormant/faqs":     template.Must(template.ParseFiles(base, dormDir+"faqs.html")),
		"dormant/feedback": template.Must(template.ParseFiles(base, dormDir+"feedback.html")),
		"dormant/error":    template.Must(template.ParseFiles(base, dormDir+"error.html")),

		"simulator/browse":     template.Must(template.ParseFiles(base, simDir+"browse.html")),
		"simulator/sandbox":    template.Must(template.ParseFiles(base, comFrag, simFrag, simDir+"sandbox.html")),
		"simulator/kinematics": template.Must(template.ParseFiles(base, comFrag, simFrag, simDir+"kinematics.html")),
		"user/allSimulations":  template.Must(template.ParseFiles(base, userDir+"allSimulations.html")),
		"user/profile":         template.Must(template.ParseFiles(base, userDir+"profile.html")),
	}
)

type PageData struct {
	CurrentUser *models.User
	Data        map[string]interface{}
}

// The 404 page handler. Just a wrapper on the ErrorHandler but has
// the same function signature.
func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	ErrorHandler(w, "Not Found!", http.StatusNotFound)
}

// Renders a nice looking error page. Call this function whenever you want
// to return and error from any other function!
func ErrorHandler(w http.ResponseWriter, errMsg string, status int) {
	var buffer bytes.Buffer
	buffer.Reset()
	w.WriteHeader(status)

	data := map[string]interface{}{
		"title":  status,
		"errMsg": errMsg,
	}
	err := templates["dormant/error"].ExecuteTemplate(&buffer, baseName, data)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	io.Copy(w, &buffer)
}

// The base handler method that all other controllers execute
func BaseHandler(w http.ResponseWriter, r *http.Request, templ string, data map[string]interface{}) {
	// Buffer is used to store rendered template temporarily instead
	// of writing it directly back to the browser incase there are
	// any errors while rendering.
	var buffer bytes.Buffer

	if data == nil {
		data = map[string]interface{}{}
	}

	// User authentication
	c := appengine.NewContext(r)
	u := user.Current(c)
	var pUser *models.User

	// Build correct login/logout links for Google
	if u == nil {
		data["loginUrl"], _ = user.LoginURL(c, "/")
		data["loginMessage"] = "Sign In"
		pUser = nil
	} else {
		data["loginUrl"], _ = user.LogoutURL(c, "/")
		data["loginMessage"] = "Sign Out"

		// Grab the user from the db
		k := datastore.NewKey(c, "User", u.ID, 0, nil)

		// Point to something
		pUser = &models.User{}

		if err := datastore.Get(c, k, pUser); err != nil {
			if err.Error() == "datastore: no such entity" {
				
				// Create new user
				pUser.Email = u.Email
				pUser.Admin = u.Admin
				pUser.ID = u.ID
				pUser.JoinDate = time.Now()

				// Put the new user in datastore
				_, err := datastore.Put(c, k, pUser)

				if err != nil {
					// Could not place the user in the datastore
					ErrorHandler(w, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
					return
				}

				if templ != "user/profile" {
					http.Redirect(w, r, "/user/"+u.ID, http.StatusFound)
					return
				}
			} else {
					ErrorHandler(w, "User object was not found: "+err.Error(), http.StatusInternalServerError)
					return
			}
		}

		// Datastore doesn't return the ID in the object so we
		// need to add it back
		pUser.ID = u.ID
	}

	pageData := &PageData{
		CurrentUser: pUser,
		Data:        data,
	}

	// Render template with all page data include user information, or error
	err := templates[templ].ExecuteTemplate(&buffer, baseName, pageData)
	if err != nil {
		ErrorHandler(w, err.Error(), http.StatusInternalServerError)
	} else {
		io.Copy(w, &buffer)
	}
}
