# Principia
An educational physics playground emphasizing visualizations.

This web-based project is designed to helps students reinforce key concepts through visualizing physical scenarios.
A user can build a system by dragging and dropping elements like ramps, pulleys, or springs into a frame in their
browser. Then the simulation can be run to see the elements interact with each other over time, with the ability to
pause the simulation at any point and query the state of an element. Users can save their simulations and share
them with others. Special privileges are available for instructor accounts to manage a classroom, including the
ability to incorporate quizzes or assignments into their physics system.

Principia serves as a powerful supplement to any physics classroom or as a playground that would allow students
to further explore concepts in a visually exciting way.


### Getting Started:
* Download and Install [Go 1.5](https://golang.org/dl/)
    * Note: If you already have an older version of Go,
      [uninstall the previous version](https://golang.org/doc/install#uninstall) first!
    * If you use Vim and want syntax highlighting for Go, add the contents of the `.vim` folder found
      [here](https://github.com/samolds/devconf) to `~/.vim/`
* Download and Install the [Google App Engine SDK for Go](https://cloud.google.com/appengine/downloads)
    * Note: The Go SDK depends on Python 2.7, so make sure you have python 2.7 installed
    * Here's what I did on my Mac:
        * Download the zip file of the SDK and extract it.
        * I moved the extracted folder, `go_appengine`, to `/usr/local/`
        * I added `export PATH="/usr/local/go_appengine:${PATH}"` to the bottom `~/.bash_profile`
        * Restart Terminal for changes to take effect
* If everything is working right, run `goapp serve` from the root of the principia directory and the go
  to [localhost:8080](localhost:8080) to see development server running
* Use `Ctrl-C` to kill the server


### Deploying Changes
View information about the app in the [Developer's Console](https://console.developers.google.com/project/theprincipiaxyz).

This is how you will push changes to the live site. Obviously, use care to make sure what is being deployed
is thorougly tested and isn't going to break anything. This command will push all of the code you have
locally up to [Google App Engine](http://theprincipiaxyz.appspot.com), and ultimately
[theprincipia.xyz](theprincipia.xyz). For best practice, make sure to only deploy when on the `production`
branch.

*Warning* - *Caution* - *Be Careful*
* Be at the root of the project
* make sure `git branch` says `production`
* make sure `git status` returns no known changes
* `goapp deploy`

### Project Structure

```
/principia
    app.yaml       -    Used for basic project settings with Google App Engine
    controllers/   -    All of the business logic for web pages
    misc/          -    Random project files not actually necessary for web app
    models.go      -    The schema for the database
    routes.go      -    What urls point to which controllers
    settings.go    -    Useful global app configurations
    static/        -    Static HTML resources
        css/       -    All CSS stuff goes here
        fonts/     -    All font related stuff goes here
        img/       -    All images used go here
        js/        -    All Javascript goes here
    views/         -    The HTML pages that are rendered by the controllers
```


### Useful Links:
* [Go Tutorial](http://tour.golang.org)
* [Go Reference](https://gobyexample.com)
* [Google App Engine with Go](https://cloud.google.com/appengine/docs/go)
* [Google App Engine with Go Tutorial](https://cloud.google.com/appengine/docs/go/gettingstarted/introduction)
* [Google App Engine Go App Config](https://cloud.google.com/appengine/docs/go/config/appconfig)
