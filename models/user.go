package models

import (
	"time"
)

type User struct {
	DisplayName string
	Interests   string `datastore:",noindex"` // Don't index this field => max size = 1MB
	Email       string
	Admin       bool
	JoinDate    time.Time
	ID          string `datastore:"-"` // Ignore this field
}
