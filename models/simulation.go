package models

import (
	"time"
)

// Root Object
type Simulation struct {
	KeyName string // UniqueID used to get Key

	Name          string
	Simulator     string `datastore:",noindex"` // Don't index this field => max size = 1MB
	Type          string
	CreationDate  time.Time
	UpdatedDate   time.Time
	IsPrivate     bool
	AuthorKeyName string // Used to get Author Key
	// Ratings by descendant
	// Comments by descendant
}
