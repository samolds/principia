function SubForm (url, type, data, successCallback){
    $.ajax({
        url: url,
        type: type,
        data: data,
        //dataType: 'json',
        success:function(){
            if(successCallback){
            	successCallback();
            }
        }
    });
}

function saveSimulation(userId, simulationId, simulationName)
{

    // New Simulation if the id has not been defined
    if(!simulationId)
    {
        $('#save-simulation-modal').modal('show');
        return;
    }
    else if(!simulationName)
    {
        $('#save-simulation-modal').modal('show');
        return;
    }

    // Save Changes
    var name = $("#simulation-name-input").val();   
}