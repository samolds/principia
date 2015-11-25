package models

import (
	"appengine/datastore"
)

type Simulation struct {
	Name         string
	Contents     string
	UserID		 string
	Key      *datastore.Key
}
