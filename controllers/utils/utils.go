package utils

import (
	"appengine"
	"appengine/datastore"
	appengineUser "appengine/user"
	"errors"
	"math"
	"math/rand"
	"models"
	"regexp"
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

	timeLen := len(now) - 1
	userLen := len(userID) - 1
	length := int(math.Min(float64(timeLen), float64(userLen)))
	unique := make([]byte, length)

	// xor the end of the user's ID with the time as a string
	for i := 0; i < length; i++ {
		unique[i] = now[timeLen-i] ^ userID[userLen-i]
	}

	// replace any unfavorable bytes with acceptable ones
	re := regexp.MustCompile("[^a-zA-Z0-9-]")
	properUnique := re.ReplaceAllString(string(unique), string(letterBytes[rand.Intn(len(letterBytes))]))

	// use this unique string to create a datastore key of 'kind' belonging to 'ancestorKey'
	key := datastore.NewKey(ctx, kind, properUnique, 0, ancestorKey)
	return key, nil
}
