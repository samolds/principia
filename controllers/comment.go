package controllers

import (
	"log"
	"net/http"
)

func CommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {

		// Persist here..
		// For now just output the comment to the console
		r.ParseForm()
		log.Println(r.Form["Content"])
	}
}
