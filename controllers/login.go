package controllers

import (
  "net/http"
)


func LoginHandler(w http.ResponseWriter, r *http.Request) {
  data := map[string]interface{}{
      "One": "Heyooo",
      "Hello": 1235,
  }
  baseHandler(w, r, "login", data)
}
