package utils

import (
	"appengine"
	"appengine/datastore"
	appengineUser "appengine/user"
	"errors"
	"log"
	"models"
	"net/http"
	"strconv"
	"time"
)

// All data necessary for nicely displaying a simulation in a view
type SimulationData struct {
	models.Simulation
	AuthorName string
}

// All data necessary for nicely displaying a comment in a view
type CommentData struct {
	models.Comment
	AuthorName string
}

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

// Builds a SimulationData object from a models.Simulation object with the proper fields
func BuildSimulationData(ctx appengine.Context, simObj models.Simulation) (SimulationData, error) {
	var author models.User
	var sim SimulationData

	authorKey := datastore.NewKey(ctx, "User", simObj.AuthorKeyName, 0, nil)
	err := datastore.Get(ctx, authorKey, &author)
	if err != nil {
		return sim, err
	}

	// Get the display name for the simulation author
	if author.DisplayName == "" {
		author.DisplayName = "Anonymous"
	}

	sim.KeyName = simObj.KeyName
	sim.Name = simObj.Name
	sim.Simulator = simObj.Simulator
	sim.Type = simObj.Type
	sim.CreationDate = simObj.CreationDate
	sim.UpdatedDate = simObj.UpdatedDate
	sim.IsPrivate = simObj.IsPrivate
	sim.AuthorName = author.DisplayName

	return sim, nil
}

// Builds a list of all of the simulations that match a query as SimulationData types
func BuildSimulationDataSlice(r *http.Request, q *datastore.Query) ([]SimulationData, error) {
	var simulationObjs []models.Simulation
	var simulations []SimulationData

	ctx := appengine.NewContext(r)
	_, err := q.GetAll(ctx, &simulationObjs)

	if err != nil {
		return simulations, err
	}

	for _, simObj := range simulationObjs {
		sim, err := BuildSimulationData(ctx, simObj)
		if err != nil {
			return simulations, err
		}
		simulations = append(simulations, sim)
	}

	return simulations, nil
}

// Builds a CommentData object from a models.Comment object with the proper fields
func BuildCommentData(ctx appengine.Context, comObj models.Comment) (CommentData, error) {
	var author models.User
	var com CommentData

	authorKey := datastore.NewKey(ctx, "User", comObj.AuthorKeyName, 0, nil)
	err := datastore.Get(ctx, authorKey, &author)
	if err != nil {
		return com, err
	}

	// Get all of the display names for each simulation author
	if author.DisplayName == "" {
		author.DisplayName = "Anonymous"
	}

	com.KeyName = comObj.KeyName
	com.Contents = comObj.Contents
	com.CreationDate = comObj.CreationDate
	com.AuthorName = author.DisplayName

	return com, nil
}

// Builds a list of all of the comments that match a query as CommentData types
func BuildCommentDataSlice(r *http.Request, q *datastore.Query) ([]CommentData, error) {
	var commentObjs []models.Comment
	var comments []CommentData

	ctx := appengine.NewContext(r)
	_, err := q.GetAll(ctx, &commentObjs)

	if err != nil {
		return comments, err
	}

	for _, comObj := range commentObjs {
		com, err := BuildCommentData(ctx, comObj)
		if err != nil {
			return comments, err
		}
		comments = append(comments, com)
	}

	return comments, nil
}
