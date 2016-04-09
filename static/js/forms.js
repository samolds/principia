function successToast(msg) {
  var $toastContent = $('<span class="green lighten-5 black-text pad"><h5><i class="fa fa-check"></i> Success!</h5><p>' + msg + '</p></span>');
  Materialize.toast($toastContent, 2000);
}

function notificationToast(header, msg) {
  var $toastContent = $('<span class="amber lighten-5 black-text pad"><h5><i class="fa fa-bullhorn"></i> ' + header + '</h5><p>' + msg + '</p></span>');
  Materialize.toast($toastContent, 8000);
}

function failToast(msg) {
  var $toastContent = $('<span class="red lighten-5 black-text pad"><h5><i class="fa fa-exclamation-triangle"></i> Failure!</h5><p>' + msg + '</p></span>');
  Materialize.toast($toastContent, 8000);
}

// Load the comments initially via AJAX
$( document ).ready(function() {
    // TODO: Just break out this JS file into form helpers and simulator helpers
    if (!isNewSim() && window.location.pathname.substr(0, 11) == "/simulator/") {
        refreshCommentsList();
        refreshRatings();
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

    simObject = { Name: $("#simulation-name").val(), Contents: exportToJson(), IsPrivate: $("#simulation-is-private").is(":checked") };

    // Is this a new simulation that we're trying to save?
    if(isNewSim()){
        // Creating a new simulation
        post(window.location.href, simObject);
        successToast('Simulation saved successfully!');
    } else {
        // Updating an existing simulation
        $.post(window.location.href, simObject)
        .done(function() { 
            // I believe 'done' is synonymous with 'success' here
            $("#save-button").removeClass( "blue" )
            $("#save-button").addClass( "green" )
            successToast('Simulation saved successfully!');
        })
        .fail(function(xhr, textStatus, errorThrown) {
          failToast(xhr.responseText);
        });
    } 

    losefocus();

}

function deleteSimulation(simUrl, redirectUrl, element) {
  $.ajax({
      url: simUrl,
      type: 'DELETE',
      success: function(result) {
        if (redirectUrl) {
          // Redirect
          window.location.href = redirectUrl;
        } else {
          // Show toast and remove from list..
          successToast("Simulation was deleted");
          $(element).hide();
        }
      },
      error: function(xhr, textStatus, errorThrown) {
        failToast(xhr.responseText);
      }
  });
}

function saveUser() {
    simObject = { DisplayName: $("#user-display-name").val(), Interests:  $("#user-interests").val()};

    $.post(window.location.href, simObject)
        .done(function() { 
            // I believe 'done' is synonymous with 'success' here
            $("#profile-save-button").removeClass( "blue" )
            $("#profile-save-button").addClass( "green" )
            successToast('User saved successfully!');
        })
        .fail(function(xhr, textStatus, errorThrown) {
          failToast(xhr.responseText);
        });
}

// Save new comment to the datastore
// and refresh the comment list
function saveComment() {
    commentObj = { Contents: $("#comment-contents").val() };

    $("#comment-load-gif").show();
    $.post("/api/simulator/" + GlobalKeyNames.Simulation + "/comments", commentObj)
      .done(function() { 
        refreshCommentsList();
        successToast('Comment saved successfully!');
      })
      .fail(function(xhr, textStatus, errorThrown) {
        $("#comment-load-gif").hide();
        failToast(xhr.responseText);
      });
}

// Save new rating to the datastore
// and refresh the ratings
function saveRating() {
    ratingObj = { Score: 1 };

    $.post("/api/simulator/" + GlobalKeyNames.Simulation + "/ratings", ratingObj)
      .done(function() { 
        refreshRatings();
        successToast('Rating updated successfully!');
      })
      .fail(function(xhr, textStatus, errorThrown) {
        failToast(xhr.responseText);
      });

}


// Called after saveComment() has finished
// posting a new comment OR on initial page load
function refreshCommentsList() {
  $.get("/api/simulator/" + GlobalKeyNames.Simulation + "/comments", function(json) {
    var result = "";
    json = JSON.parse(json);
    if (json) {
      for (var i = 0; i < json.length; i++) {
        var comment = json[i];
        result +=  "<div class='row'>";
        result +=   "<div class='col s2'><a href='/user/" + comment.AuthorID + "'>";
        result +=    "<i class='medium fa fa-user'></i>";
        result +=    "<small>" + comment.AuthorName + "</small>";
        result +=  "</a></div>";
        result +=  "<div class='col s10 all-bubble-content' id='new-comment'>";
        result +=    "<div class='row'>";
        result +=      "<div class='all-point'></div>";
        result +=      "<div class='col  s12'>";
        result +=         "<p class=''>" +comment.Contents+"</p> ";
        result +=      "</div></div></div></div>";
      }
    }

    if ((json === null || json.length === 0) && GlobalKeyNames.User === "") {
      $("#comments-frag").hide();
    }

    $("#comments").html(result);
    $("#comment-load-gif").hide();
    $("#comment-contents").val("");
  })
  .fail(function() {
    $("#comment-load-gif").hide();
  });
}

// Called after saveRating() has finished
// posting a new rating OR on initial page load
function refreshRatings() {
    $.get("/api/simulator/" + GlobalKeyNames.Simulation + "/ratings", function(response) {
      json = JSON.parse(response);

      var rater = false;

      if (json.Ratings) {
        for (var i = 0; i < json.Ratings.length; i++) {
          if (json.Ratings[i].AuthorKeyName == GlobalKeyNames.User) {
            rater = true;
          }
        }
      }

      if (rater) {
        $("#star-icon").removeClass("fa-star-o");
        $("#star-icon").addClass("fa-star");
      } else {
        $("#star-icon").removeClass("fa-star");
        $("#star-icon").addClass("fa-star-o");
      }
      $("#ratings").attr("data-tooltip", json.TotalScore + " Stars");
    })
    .fail(function() {
    });    
}

// Determines from the url if the simulation
// is a new simulation or an existing simulation
function isNewSim(){
  if (typeof GlobalKeyNames !== 'undefined') {
    if (!GlobalKeyNames.Simulation) {
      return true;
    }

    return GlobalKeyNames.Simulation == null || GlobalKeyNames.Simulation == "";
  } else {
    return false;
  }
}

// Used when uploading a new profile picture on the profile page
function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            $('#profile-pic')
                .attr('src', e.target.result)
        };

        reader.readAsDataURL(input.files[0]);
    }

}

function getfocus() {
    document.getElementById("simulation-name").focus();
    document.getElementById("simulation-name-label").style.display = "initial";

}

function losefocus() {
    document.getElementById("simulation-name").blur();
    document.getElementById("simulation-name-label").style.display = "none";

}
