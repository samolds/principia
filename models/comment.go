package models

import (
	"time"
)

// Belong to Simulation
type Comment struct {
	KeyID string // Encoded datastore key

	Contents     string
	CreationDate time.Time
	AuthorKey    string // Encoded datastore key
	// Ratings by descendant

	// AncestorKey = Simulation
	// Using AncecstorKey for strong consistency
}
