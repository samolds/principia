package controllers

import (
	"appengine"
	"appengine/datastore"
	appengineUser "appengine/user"
	"bytes"
	"html"
	"html/template"
	"io"
	"lib/gomobiledetect"
	"models"
	"net/http"
	"strings"
	"time"
)

var (
	tmplDir = "views/"
	dormDir = tmplDir + "dormant/"
	simDir  = tmplDir + "simulator/"
	userDir = tmplDir + "user/"
	testDir = tmplDir + "test/"

	simFrag = simDir + "simulator.frag.html"
	comFrag = simDir + "comments.frag.html"

	baseName = "base"
	base     = tmplDir + baseName + ".html"

	templates = map[string]*template.Template{
		"dormant/home":        template.Must(template.ParseFiles(base, dormDir+"home.html")),
		"dormant/about":       template.Must(template.ParseFiles(base, dormDir+"about.html")),
		"dormant/faqs":        template.Must(template.ParseFiles(base, dormDir+"faqs.html")),
		"dormant/feedback":    template.Must(template.ParseFiles(base, dormDir+"feedback.html")),
		"dormant/unsupported": template.Must(template.ParseFiles(base, dormDir+"unsupported.html")),
		"dormant/error":       template.Must(template.ParseFiles(base, dormDir+"error.html")),

		"simulator/browse":     template.Must(template.ParseFiles(base, simDir+"browse.html")),
		"simulator/kinematics": template.Must(template.ParseFiles(base, comFrag, simFrag, simDir+"kinematics.html")),

		"simulator/layout": template.Must(template.ParseFiles(base, comFrag, simFrag, simDir+"layout.html")),

		"user/simulations": template.Must(template.ParseFiles(base, userDir+"simulations.html")),
		"user/profile":     template.Must(template.ParseFiles(base, userDir+"profile.html")),

		"test/kinematics": template.Must(template.ParseFiles(testDir + "KinematicsRunner.html")),
	}
)

type PageData struct {
	IsLoggedIn bool
	User       models.User
	Data       map[string]interface{}
}

// The 404 page handler. Just a wrapper on the ErrorHandler but has
// the same function signature necessary for routes
func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	ErrorHandler(w, "Not Found!", http.StatusNotFound)
}

// Renders a nice looking error page. Call this function whenever you want
// to return and error template from any other function!
func ErrorHandler(w http.ResponseWriter, errMsg string, status int) {
	var buffer bytes.Buffer

	// TODO: Add user information stuff. Sign in links aren't rendered on error pages

	data := map[string]interface{}{
		"title":  status,
		"errMsg": errMsg,
	}

	w.WriteHeader(status)
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
	ctx := appengine.NewContext(r)
	googleUser := appengineUser.Current(ctx)
	var user models.User
	isLoggedIn := false

	// Build correct login/logout links for Google
	if googleUser == nil {
		data["loginUrl"], _ = appengineUser.LoginURL(ctx, html.EscapeString(r.URL.Path))
		data["loginMessage"] = "Sign In"
	} else {
		data["loginUrl"], _ = appengineUser.LogoutURL(ctx, "/")
		data["loginMessage"] = "Sign Out"
		isLoggedIn = true

		// TODO-OO: Better way to do this? -> Do this in the profile handler and redirect?

		// Maybe TODO XOR this with something CONSTANT to mask the
		// user id? maybe that doesn't matter?
		userKeyName := googleUser.ID
		userKey := datastore.NewKey(ctx, "User", userKeyName, 0, nil)
		err := datastore.Get(ctx, userKey, &user)

		if err != nil {
			if err == datastore.ErrNoSuchEntity {
				// Create new user
				user = models.User{
					KeyName:  userKeyName,
					GoogleID: googleUser.ID,
					Email:    googleUser.Email,
					Admin:    googleUser.Admin,
					JoinDate: time.Now(),
				}

				// Put the new user in datastore
				_, err := datastore.Put(ctx, userKey, &user)

				if err != nil {
					// Could not place the user in the datastore
					ErrorHandler(w, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
					return
				}

				if templ != "user/profile" {
					http.Redirect(w, r, "/user/"+user.KeyName, http.StatusFound)
					return
				}
			} else {
				ErrorHandler(w, "User was not found: "+err.Error(), http.StatusNotFound)
				return
			}
		}
	}
	// END TODO-OO

	pageData := &PageData{
		IsLoggedIn: isLoggedIn,
		User:       user,
		Data:       data,
	}

	// Render template with all page data including user information, or error
	err := templates[templ].ExecuteTemplate(&buffer, baseName, pageData)

	// Catch mobile users and render mobile friendly template
	detect := mobiledetect.NewMobileDetect(r, nil)
	if detect.IsMobile() && strings.HasPrefix(templ, "simulator/") {
		buffer.Reset()
		err = templates["dormant/unsupported"].ExecuteTemplate(&buffer, baseName, pageData)
	}

	if err != nil {
		ErrorHandler(w, err.Error(), http.StatusInternalServerError)
	} else {
		io.Copy(w, &buffer)
	}
}
