// Load the comments initially via AJAX
$( document ).ready(function() {
    
    if(!isNewSim()) {
        refreshCommentsList();
    }
    else {
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

function saveSimulation(){

    // Save Changes
    var simObject = new Object();
    simObject.Name = $("#simulation-name").val();  
    simObject.Contents = "TEST CONTENT";

    // Is this a new simulation that we're trying to save?
    if(isNewSim()){
        // Creating a new simulation
        post(window.location.href, simObject);
    } else {
        // Updating an existing simulation
        $.post(window.location.href, simObject);
    } 

    losefocus();
}

function getfocus() 
{
    document.getElementById("simulation-name").focus();

    document.getElementById("simulation-name-label").style.display = "initial";
}
function losefocus() 
{
    document.getElementById("simulation-name").blur();
    document.getElementById("simulation-name-label").style.display = "none";
}

function saveComment() {

    var commentObj = new Object();
    commentObj.Contents = $("#comment-contents").val();

    $("#comment-load-gif").show();
    $.post( window.location.href + "/comments", commentObj)
      .done(function( data ) {
        refreshCommentsList();
      });

}

function refreshCommentsList() {

    $.get(window.location.href + "/comments", function( json ) {
        
        var result = "";
        json = JSON.parse(json);

        for(var i = 0; i < json.length; i++) {
            var comment = json[i];

            // result += "<div class='row'>";
            // result += "USER ID: " + comment.UserID + "<br/>";
            // result += "Contents: " + comment.Contents + "<br/>";
            // result += "Simulation ID: " + comment.SimulationID + "<br/>";
            // result += "</div>";

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
            //     </div>
            //   </div>
            // </div>";




        }

      $( "#comments" ).html( result );

      $("#comment-load-gif").hide();
    });    

}

function isNewSim(){

    var re = new RegExp('\/simulator$');
    return re.test(window.location.href);

}