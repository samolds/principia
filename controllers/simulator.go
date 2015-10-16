package controllers

import (
	"math/rand"
	"net/http"
	"time"
)

type Cont struct {
	X string
	Y int
}

func SimulatorHandler(w http.ResponseWriter, r *http.Request) {
	rand.Seed(time.Now().UTC().UnixNano())

	dynPossibles := [...]string{
		"Comment 1",
		"Comment 2",
		"Comment 3",
		"Comment 4",
		"Comment 5",
		"Comment 6",
		"Comment 7",
	}

	dyn := dynPossibles[rand.Intn(len(dynPossibles))]
	cont := &Cont{X: "hello", Y: 1234}

	data := map[string]interface{}{
		"slice": dynPossibles,
		"dyn":   dyn,
		"stVal": cont,
	}
	baseHandler(w, r, "simulator", data)
}
