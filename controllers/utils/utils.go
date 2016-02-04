package utils

import (
	"appengine"
	"appengine/datastore"
	appengineUser "appengine/user"
	"errors"
	"log"
	"models"
	"strconv"
	"time"
)

// Returns true if the user.ID and simUserId are equivalent
func IsOwner(simUserKey string, ctx appengine.Context) bool {
	currentUser, err := GetCurrentUser(ctx)

	if err != nil {
		return false
	}

	return simUserKey == currentUser.KeyName
}

// Converts a string to int64
func StringToBool(s string) bool {
	result, err := strconv.ParseBool(s)

	if err != nil {
		log.Println(err.Error())
	}

	return result
}

// Returns the current user from the google id
func GetCurrentUser(ctx appengine.Context) (models.User, error) {
	googleUser := appengineUser.Current(ctx)
	var user models.User

	if googleUser == nil {
		return user, errors.New("No Google user")
	}

	// Get the userKey from the googleUser ID
	userKey := datastore.NewKey(ctx, "User", googleUser.ID, 0, nil)
	err := datastore.Get(ctx, userKey, &user)

	return user, err
}

// Generates a psuedo random unique key based on time and userID
func GenerateUniqueKey(ctx appengine.Context, kind string, user models.User, ancestorKey *datastore.Key) (*datastore.Key, string) {
	tstamp := time.Now().Unix() // seconds since epoch: ~1351700038
	unique := user.KeyName + strconv.FormatInt(tstamp, 10)

	// use this unique string to create a datastore key of 'kind' belonging to 'ancestorKey'
	key := datastore.NewKey(ctx, kind, unique, 0, ancestorKey)
	return key, unique
}
