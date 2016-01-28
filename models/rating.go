package models

import (
	"time"
)

type Rating struct {
	UserID       string
	Date         time.Time
  Score        int64
}
