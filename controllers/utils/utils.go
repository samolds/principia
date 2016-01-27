package utils

import (
	"appengine/user"
	"log"
	"strconv"
)

// Converts a string to int64
func StringToInt64(s string) int64 {
	result, err := strconv.ParseInt(s, 10, 64)

	if err != nil {
		log.Println(err.Error())
	}

	return result
}

// Converts a string to int64
func StringToBool(s string) bool {
	result, err := strconv.ParseBool(s)

	if err != nil {
		log.Println(err.Error())
	}

	return result
}

// Returns true if the user.ID and simUserId are equivalent
func IsOwner(simUserId string, u *user.User) bool {
	if u == nil {
		return false
	}

	return simUserId == u.ID
}
