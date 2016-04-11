package models

import (
	"time"
)

// Root Object Stored in Datastore
type Simulation struct {
	KeyName string // UniqueID used to get Key

	Name          string
	Simulator     string `datastore:",noindex"` // Don't index this field => max size = 1MB
	Type          string
	Description   string `datastore:",noindex"` // Don't index this field => max size = 1MB
	CreationDate  time.Time
	UpdatedDate   time.Time
	IsPrivate     bool
	AuthorKeyName string // Used to get Author Key
	// Ratings by descendant
	// Comments by descendant
}

// Not a database object -> Information put in this format to pass to a view
// All data necessary for nicely displaying a simulation in a view
type SimulationData struct {
	Simulation
	AuthorName  string
	AuthorID    string
	RatingTotal int
}

// ByRating implements sort.Interface for []SimulationData based on
// the RatingTotal field.
type ByRating []SimulationData

func (sim ByRating) Len() int           { return len(sim) }
func (sim ByRating) Swap(i, j int)      { sim[i], sim[j] = sim[j], sim[i] }
func (sim ByRating) Less(i, j int) bool { return sim[i].RatingTotal > sim[j].RatingTotal }
