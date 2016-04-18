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
	"time"
)

var (
	tmplDir = "views/"
	dormDir = tmplDir + "dormant/"
	simDir  = tmplDir + "simulator/"
	userDir = tmplDir + "user/"
	testDir = tmplDir + "test/"

	simListFrag = simDir + "simList.frag.html"
	comFrag     = simDir + "comments.frag.html"

	baseName = "base"
	base     = tmplDir + baseName + ".html"

	templateHelpers = template.FuncMap{
		"evenlyDivisible": func(a, b int) bool {
			return (a % b) == 0
		},
	}

	templates = map[string]*template.Template{
		"dormant/home":        template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, simListFrag, dormDir+"home.html")),
		"dormant/about":       template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, dormDir+"about.html")),
		"dormant/faqs":        template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, dormDir+"faqs.html")),
		"dormant/feedback":    template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, dormDir+"feedback.html")),
		"dormant/help":        template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, dormDir+"help.html")),
		"dormant/unsupported": template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, dormDir+"unsupported.html")),
		"dormant/error":       template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, dormDir+"error.html")),

		"simulator/browse":     template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, simListFrag, simDir+"browse.html")),
		"simulator/mobile":     template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, comFrag, simDir+"mobile.html")),
		"simulator/kinematics": template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, comFrag, simDir+"kinematics.html")),

		"user/simulations":  template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, simListFrag, userDir+"simulations.html")),
		"user/interactions": template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, simListFrag, userDir+"interactions.html")),
		"user/profile":      template.Must(template.New("").Funcs(templateHelpers).ParseFiles(base, simListFrag, userDir+"profile.html")),

		"test/kinematics": template.Must(template.ParseFiles(testDir + "KinematicsRunner.html")),
	}
)

type PageData struct {
	IsLoggedIn   bool
	LoginUrl     string
	LoginMessage string
	User         models.User
	Data         map[string]interface{}
}

// The 404 page handler. Just a wrapper on the ErrorHandler but has
// the same function signature necessary for routes
func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	ErrorHandler(w, r, "Not Found!", http.StatusNotFound)
}

// Renders a nice looking error page. Call this function whenever you want
// to return and error template from any other function!
func ErrorHandler(w http.ResponseWriter, r *http.Request, errMsg string, status int) {
	var buffer bytes.Buffer

	// Get current user information for signin links
	ctx := appengine.NewContext(r)
	googleUser := appengineUser.Current(ctx)
	var loginUrl string
	var loginMessage string
	var err error

	// Build correct login/logout links for Google but don't worry about
	// showing full user information, so don't get user object
	if googleUser == nil {
		loginUrl, err = appengineUser.LoginURL(ctx, html.EscapeString(r.URL.Path))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		loginMessage = "Sign In"
	} else {
		loginUrl, err = appengineUser.LogoutURL(ctx, "/")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		loginMessage = "Sign Out"
	}

	data := map[string]interface{}{
		"title":        status,
		"errMsg":       errMsg,
		"LoginUrl":     loginUrl,
		"LoginMessage": loginMessage,
	}

	w.WriteHeader(status)
	err = templates["dormant/error"].ExecuteTemplate(&buffer, baseName, data)
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
	var isLoggedIn bool
	var loginUrl string
	var loginMessage string

	// Build correct login/logout links for Google
	if googleUser == nil {
		isLoggedIn = false
		loginUrl, _ = appengineUser.LoginURL(ctx, html.EscapeString(r.URL.Path))
		loginMessage = "Sign In"
	} else {
		isLoggedIn = true
		loginUrl, _ = appengineUser.LogoutURL(ctx, "/")
		loginMessage = "Sign Out"

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
					ErrorHandler(w, r, "Could not save user data: "+err.Error(), http.StatusInternalServerError)
					return
				}

				if templ != "user/profile" {
					http.Redirect(w, r, "/user/"+user.KeyName, http.StatusFound)
					return
				}
			} else {
				ErrorHandler(w, r, "User was not found: "+err.Error(), http.StatusNotFound)
				return
			}
		}
	}
	// END TODO-OO

	pageData := &PageData{
		IsLoggedIn:   isLoggedIn,
		LoginUrl:     loginUrl,
		LoginMessage: loginMessage,
		User:         user,
		Data:         data,
	}

	// Catch mobile users and render mobile friendly template
	detect := mobiledetect.NewMobileDetect(r, nil)
	var err error

	if detect.IsMobile() && templ == "simulator/kinematics" {
		// Render mobile specific template
		if data["new"] == true { // Have to specifically check because data["new"] type is interface, not bool
			// The user cannot create new simulations on mobile
			err = templates["dormant/unsupported"].ExecuteTemplate(&buffer, baseName, pageData)
		} else {
			// The user can watch existing simulations on mobile
			err = templates["simulator/mobile"].ExecuteTemplate(&buffer, baseName, pageData)
		}
	} else {
		// Render normal browser version
		// Render template with all page data including user information, or error
		err = templates[templ].ExecuteTemplate(&buffer, baseName, pageData)
	}

	if err != nil {
		ErrorHandler(w, r, err.Error(), http.StatusInternalServerError)
	} else {
		io.Copy(w, &buffer)
	}
}
