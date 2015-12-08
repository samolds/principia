package models

import ()

type Simulation struct {
	Name     string
  // Tell datastore not to index this field, increase max size
  // from 1500 bytes to ~ 1 MB
	Contents string `datastore:",noindex"`
	UserID   string
	// Tell datastore to ignore thie field
	Id int64 `datastore:"-"`
}
