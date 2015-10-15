package controllers

import (
	"net/http"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	data := map[string]interface{}{
		"One":   "Heyooo",
		"Hello": 1235,
	}
	baseHandler(w, r, "home", data)
}
