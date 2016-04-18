package utils

import (
	"appengine"
	"appengine/datastore"
	appengineImage "appengine/image"
	appengineUser "appengine/user"
	"errors"
	"log"
	"models"
	"net/http"
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

// Builds a SimulationData object from a models.Simulation object with the proper fields
func BuildSimulationData(ctx appengine.Context, simObj models.Simulation, simKey *datastore.Key) (models.SimulationData, error) {
	var author models.User
	var sim models.SimulationData

	thumbnailImage, err := appengineImage.ServingURL(ctx, simObj.ImageBlobKey, nil)
	if err != nil {
		return sim, err
	}

	authorKey := datastore.NewKey(ctx, "User", simObj.AuthorKeyName, 0, nil)
	err = datastore.Get(ctx, authorKey, &author)
	if err != nil {
		return sim, err
	}

	q := datastore.NewQuery("Rating").Ancestor(simKey)
	simFaves, err := q.Count(ctx)
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
	sim.Description = simObj.Description
	sim.CreationDate = simObj.CreationDate
	sim.UpdatedDate = simObj.UpdatedDate
	sim.ImageSrcUrl = thumbnailImage.Path
	sim.IsPrivate = simObj.IsPrivate
	sim.AuthorName = author.DisplayName
	sim.AuthorID = author.KeyName
	sim.RatingTotal = simFaves

	return sim, nil
}

// Builds a list of all of the simulations that match a query as SimulationData types
func BuildSimulationDataSlice(ctx appengine.Context, simulationObjs []models.Simulation, simulationKeys []*datastore.Key) ([]models.SimulationData, error) {
	var simulations []models.SimulationData

	for i, _ := range simulationObjs {
		sim, err := BuildSimulationData(ctx, simulationObjs[i], simulationKeys[i])
		if err != nil {
			return simulations, err
		}
		simulations = append(simulations, sim)
	}

	return simulations, nil
}

// Builds a list of all of the simulations that match a query as SimulationData types
func GetSimulationDataSlice(r *http.Request, q *datastore.Query) ([]models.SimulationData, error) {
	var simulations []models.SimulationData
	var simulationObjs []models.Simulation

	ctx := appengine.NewContext(r)
	simulationKeys, err := q.GetAll(ctx, &simulationObjs)

	if err != nil {
		return simulations, err
	}

	return BuildSimulationDataSlice(ctx, simulationObjs, simulationKeys)
}

// Builds a CommentData object from a models.Comment object with the proper fields
func BuildCommentData(ctx appengine.Context, comObj models.Comment, commentKey *datastore.Key) (models.CommentData, error) {
	var author models.User
	var sim models.Simulation
	var com models.CommentData

	authorKey := datastore.NewKey(ctx, "User", comObj.AuthorKeyName, 0, nil)
	err := datastore.Get(ctx, authorKey, &author)
	if err != nil {
		return com, err
	}

	var profileImageSrc string
	profileImage, err := appengineImage.ServingURL(ctx, author.ImageBlobKey, nil)
	if err == nil {
		profileImageSrc = profileImage.Path
	}

	err = datastore.Get(ctx, commentKey.Parent(), &sim)
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
	com.PrettyCreationDate = comObj.CreationDate.Format("January _2, 2006")
	com.AuthorName = author.DisplayName
	com.AuthorID = author.KeyName
	com.AuthorImageSrcUrl = profileImageSrc
	com.SimulationName = sim.Name
	com.SimulationID = sim.KeyName
	com.SimulationType = sim.Type

	return com, nil
}

// Builds a list of all of the comments that match a query as CommentData types
func GetCommentDataSlice(r *http.Request, q *datastore.Query) ([]models.CommentData, error) {
	var commentKeys []*datastore.Key
	var commentObjs []models.Comment
	var comments []models.CommentData

	ctx := appengine.NewContext(r)
	commentKeys, err := q.GetAll(ctx, &commentObjs)

	if err != nil {
		return comments, err
	}

	for i, _ := range commentObjs {
		com, err := BuildCommentData(ctx, commentObjs[i], commentKeys[i])
		if err != nil {
			return comments, err
		}
		comments = append(comments, com)
	}

	return comments, nil
}
