package models

import (
	"time"
)

// Root Object
type User struct {
	KeyID    string // Encoded datastore key
	GoogleID string

	DisplayName string
	Interests   string
	Email       string
	Admin       bool
	JoinDate    time.Time
}
