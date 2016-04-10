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

	// AncestorKey (key.Parent()) = Simulation
	// Using AncecstorKey for strong consistency
}


// Not a database object -> Information put in this format to pass to a view
// All data necessary for nicely displaying a comment in a view
type CommentData struct {
	Comment
	AuthorName     string
	AuthorID       string
	SimulationName string
	SimulationID   string
	SimulationType string
}
