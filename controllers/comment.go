package controllers

import (
	"net/http"
	"log"
)

func CommentHandler(w http.ResponseWriter, r *http.Request) {
	
	if(r.Method == "POST") {

		// Persist here..
		// For now just output the comment to the console
		r.ParseForm()
		log.Println(r.Form["Content"])

	}	

}
