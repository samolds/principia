package utils

import (
	"appengine"
	"appengine/datastore"
	appengineUser "appengine/user"
	"crypto/sha1"
	"encoding/base32"
	"errors"
	"models"
	"strings"
	"time"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"

// Returns true if the user.ID and simUserId are equivalent
func IsOwner(simUserKey string, ctx appengine.Context) bool {
	currentUser, err := GetCurrentUser(ctx)

	if err != nil {
		return false
	}

	if currentUser.KeyID == "" {
		return false
	}

	return simUserKey == currentUser.KeyID
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
func GenerateUniqueKey(ctx appengine.Context, kind string, userID string, ancestorKey *datastore.Key) (*datastore.Key, error) {
	now := time.Now().Format(time.RFC3339)

	if userID == "" {
		user, err := GetCurrentUser(ctx)
		if err != nil {
			return nil, err
		}
		userID = user.KeyID
	}

	// SHA1 hash
	hash := sha1.New()
	hash.Write([]byte(userID + now))
	hashBytes := hash.Sum(nil)

	// Conversion to base32
	unique := strings.ToLower(base32.HexEncoding.EncodeToString(hashBytes))

	// use this unique string to create a datastore key of 'kind' belonging to 'ancestorKey'
	key := datastore.NewKey(ctx, kind, unique, 0, ancestorKey)
	return key, nil
}
