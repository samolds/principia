package models

import (
	"time"
)

type Simulation struct {
	Name         string
	Contents     string `datastore:",noindex"` // Don't index this field => max size = 1MB
	UserID       string
	Type         string
	CreationDate time.Time
	UpdatedDate  time.Time
	Id           int64 `datastore:"-"` // Ignore this field
}
