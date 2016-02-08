package models

import (
	"time"
)

// Root Object
type User struct {
	KeyName  string // UniqueID used to get Key
	GoogleID string

	DisplayName string
	Interests   string
	Email       string
	Admin       bool
	JoinDate    time.Time
}
