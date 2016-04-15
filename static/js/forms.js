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


function formPost(path, parameters, successMessage) {
  var fd = new FormData(document.forms[0]);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', path);

  if (isNewSim()) {
    xhr.onload = function() { // After the post is done, redirect
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          window.location = xhr.responseText; // Redirects to saved simulation link
          successToast(successMessage);
        } else {
          failToast(xhr.responseText);
        }
      }
    };
  } else {
    xhr.onload = function() { // Show toasts
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status === 200) {
          if ($("#save-button").size() > 0) {
            $("#save-button").removeClass( "blue" )
            $("#save-button").addClass( "green" )
          }
          window.location.reload(); // Necessary to get new image save form "action" attribute
          successToast(successMessage);
        } else {
          failToast(xhr.responseText);
        }
      }
    };
  }

  for (var i = 0; i < parameters.length; i++) {
    fd.append(parameters[i].name, parameters[i].value);
  }

  // Post data
  xhr.send(fd);
}


// Saves the simulation, whether new or existing
// if a new simulation it does NOT use ajax to allow
// for a page redirect to simulator/{simulatorId}
function saveSimulation(postURL){
  if (!postURL) {
    postURL = window.location.href;
  }

  simObject = [
    {name: "Name",        value: $("#simulation-name").val(),                type: "text"},
    {name: "Contents",    value: exportToJson(),                             type: "text"},
    {name: "Description", value: $("#simulation-description").val(),         type: "text"},
    {name: "IsPrivate",   value: $("#simulation-is-private").is(":checked"), type: "text"},
    {name: "Thumbnail",   value: dataURItoBlob(canvasToImage()),             type: "file"},
  ];

  formPost(postURL, simObject, "Simulation saved successfully!");

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

function validateUserImageSelection() {
  var uploadMessage = $('#image-upload-message')[0];

  var imageFiles = document.getElementById("user-profile-image").files;
  if (imageFiles && imageFiles[0].size < 500000) { // 500kB
    uploadMessage.text = "Ready to save " + imageFiles[0].name + "!";
  } else {
    uploadMessage.text = "This image might be too large! The max file size is 500KB";
  }
}

function saveUser(postURL) {
  if (!postURL) {
    postURL = window.location.href;
  }

  var imageFiles = document.getElementById("user-profile-image").files;
  if (imageFiles && imageFiles[0]) {
    if (imageFiles[0].size < 500000) { // 500KB
      userObject = [
        {name: "DisplayName",  value: $("#user-display-name").val(), type: "text"},
        {name: "Interests",    value: $("#user-interests").val(),    type: "text"},
        {name: "ProfileImage", value: imageFiles[0],                 type: "file"},
      ];

      formPost(postURL, userObject, "Information saved successfully!");
    } else {
      failToast("This image might be too large! The max file size is 500KB");
    }
  } else {
    userObject = [
      {name: "DisplayName",  value: $("#user-display-name").val(), type: "text"},
      {name: "Interests",    value: $("#user-interests").val(),    type: "text"},
    ];

    formPost(postURL, userObject, "Information saved successfully!");
  }
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
        var displayName = 'Anonymous';
        if (comment.AuthorName) {
          displayName = comment.AuthorName;
        }

        var imgDisplay = "<i class='medium black-text fa fa-user'></i>";
        if (comment.AuthorImageSrcUrl) {
          imgDisplay = "<img src='" + comment.AuthorImageSrcUrl + "' class='responsive-img'>"
        }

        result += "<div class='col s12'>";
        result +=   "<div class='row'>";
        result +=     "<div class='card-panel valign-wrapper'>";
        result +=       "<div class='col s3'>";
        result +=         "<div class='center-align'>";
        result +=           "<a href='/user/" + comment.AuthorID + "'>" + imgDisplay + "</a>";
        result +=         "</div>";
        result +=         "<div class='center-align'>";
        result +=           "<a href='/user/" + comment.AuthorID + "'><small>" + displayName + "</small></a>";
        result +=         "</div>";
        result +=       "</div>";
        result +=       "<div class='col s9'>";
        result +=         "<span class='black-text'>";
        result +=           comment.Contents
        result +=         "</span>";
        result +=       "</div>";
        result +=     "</div>";
        result +=   "</div>";
        result += "</div>";
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

function getfocus() {
    document.getElementById("simulation-name").focus();
    document.getElementById("simulation-name-label").style.display = "initial";

}

function losefocus() {
    document.getElementById("simulation-name").blur();
    document.getElementById("simulation-name-label").style.display = "none";

}
