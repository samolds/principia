package models

import ()

type Simulation struct {
	Name     string
	Contents string `datastore:",noindex"`
	UserID   string
	// Tell datastore to ignore thie field
	Id int64 `datastore:"-"`
}
