package models

import (
	"time"
)

// Belong to Simulation or Comment
type Rating struct {
	KeyName string // UniqueID used to get Key

	Score         int8
	CreationDate  time.Time
	AuthorKeyName string // Used to get Author Key

	// AncestorKey (key.Parent()) = Thing that was rated
	// Using AncecstorKey for strong consistency
}
