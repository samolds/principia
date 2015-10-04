package controllers

import {
  "fmt"
}

func handle(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "<html><body>Ayooo</body></html>")
}
