// Load the comments initially via AJAX
$( document ).ready(function() {
    if (!isNewSim()) {
        refreshCommentsList(globalSimulationId);
    } else {
        $("#comment-load-gif").hide();
    }
});

function post(path, parameters) {
    var form = $('<form></form>');

    form.attr("method", "post");
    form.attr("action", path);


    for (var key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        var field = $('<input></input>');

        field.attr("type", "hidden");
        field.attr("name", key);
        field.attr("value", parameters[key]);

        form.append(field);
      }
    }

    // The form needs to be a part of the document in
    // order for us to be able to submit it.
    $(document.body).append(form);
    form.submit();
}

// Saves the simulation, whether new or existing
// if a new simulation it does NOT use ajax to allow
// for a page redirect to simulator/{simulatorId}
function saveSimulation(){

    simObject = { Name: $("#simulation-name").val(), Contents: exportToJson() };

    // Is this a new simulation that we're trying to save?
    if(isNewSim()){
        // Creating a new simulation
        post(window.location.href, simObject);
    } else {
        // Updating an existing simulation
        $.post(window.location.href, simObject)
        .done(function() { 
            // I believe 'done' is synonymous with 'success' here
            $("#save-button").removeClass( "blue" )
            $("#save-button").addClass( "green" )
      });
    } 

    losefocus();

}

function getfocus() {
    document.getElementById("simulation-name").focus();
    document.getElementById("simulation-name-label").style.display = "initial";

}

function losefocus() {
    document.getElementById("simulation-name").blur();
    document.getElementById("simulation-name-label").style.display = "none";

}

// Save new comment to the datastore
// and refresh the comment list
function saveComment() {
    commentObj = { Contents: $("#comment-contents").val() };

    $("#comment-load-gif").show();
    $.post("/api/simulator/" + globalSimulationId + "/comments", commentObj)
      .done(function( data ) { 
        refreshCommentsList();
      });
}

// Called after saveComment() has finished
// posting a new comment OR on initial page load
function refreshCommentsList() {

    $.get("/api/simulator/" + globalSimulationId + "/comments", function(json) {
        var result = "";
        json = JSON.parse(json);

        for(var i = 0; i < json.length; i++) {
            var comment = json[i];

            result +=  "<div class='row'>";
            result +=   "<div class='col s2'>";
            result +=    "<i class='medium material-icons'>account_circle</i>";
            result +=  "</div>";
            result +=  "<div class='col s10 all-bubble-content' id='new-comment'>";
            result +=    "<div class='row'>";
            result +=      "<div class='all-point'></div>";
            result +=      "<div class='col  s12'>";
            result +=         "<p class=''>" +comment.Contents+"</p> ";                  
            result +=      "</div></div></div></div>";

        }

      $( "#comments" ).html( result );

      $("#comment-load-gif").hide();
      // Reset the comment box text
      $("#comment-contents").val("");

    });    

}

// Determines from the url if the simulation
// is a new simulation or an existing simulation
function isNewSim(){
  return globalSimulationId == null;
}
