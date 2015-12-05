package models

import (
	"time"
)

type Comment struct {
	UserID       string
	Contents     string
	Date         time.Time
	SimulationID int64
}
