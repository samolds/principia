function makeAsyncRequest (url, type, data, successCallback){
    $.ajax({
        url: url,
        type: type,
        data: data,
        dataType: 'json',
        success:function(){
            if(successCallback){
            	successCallback();
            }
        }
    });
}


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

function saveSimulation(simObject)
{
    // Save Changes
    simObject.Name = $("#simulation-name").val();  
    simObject.Contents = "TEST CONTENT";

    if(simObject.SimulationID){
        makeAsyncRequest(window.location.href, "POST", simObject, alert("SUCCESS"));
    } else {
        post(window.location.href, simObject);
    } 
}
