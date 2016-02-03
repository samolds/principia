package models

import (
	"time"
)

// Root Object
type Simulation struct {
	KeyID string // Encoded datastore key

	Name         string
	Simulator    string `datastore:",noindex"` // Don't index this field => max size = 1MB
	Type         string
	CreationDate time.Time
	UpdatedDate  time.Time
  IsPrivate    bool
	AuthorKey    string // Encoded datastore key
	// Ratings by descendant
	// Comments by descendant
}
