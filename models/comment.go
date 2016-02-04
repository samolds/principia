package models

import (
	"time"
)

// Belong to Simulation
type Comment struct {
	KeyName string // UniqueID used to get Key

	Contents      string
	CreationDate  time.Time
	AuthorKeyName string // Used to get Author Key
	// Ratings by descendant

	// AncestorKey = Simulation
	// Using AncecstorKey for strong consistency
}
