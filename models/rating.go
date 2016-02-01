package models

import (
	"time"
)

// Belong to Simulation or Comment
type Rating struct {
	KeyID string // Encoded datastore key

	Score        int8
	CreationDate time.Time
	AuthorKey    string // Encoded datastore key

	// AncestorKey = Thing that was rated
	// Using AncecstorKey for strong consistency
}
