// this is for updating tabs for the properties window
$(document).ready(function(){
  $('ul.tabs').tabs('select_tab', 'tab_id');
});


function showVectors() {
  var checkbox = document.getElementById('vector-checkbox');
  if( checkbox.checked)
  {    
    //show vectors;
    Globals.bodyConstants[bIndex(Globals.selectedBody)].vectors = true;
  }
  else
  {
    //dont show vectors;
    Globals.bodyConstants[bIndex(Globals.selectedBody)].vectors = false;
  }
  
  drawMaster();

  // Show that we've made changes that we need to now save
  resetSaveButton();
}

function showPVAGraph() {
  var checkbox = document.getElementById('pvagraph-checkbox');

  if(checkbox.checked)
  {
    //show graph;
    Globals.bodyConstants[bIndex(Globals.selectedBody)].showGraph = true;
  }
  else
  {
    //dont show graph;
    Globals.bodyConstants[bIndex(Globals.selectedBody)].showGraph = false;
  }

  allHidden = graphBodyIndices().length === 0;

  if(allHidden){
    $("#pvaGraphContainer").hide();
  } else {
    $("#pvaGraphContainer").show();
    updatePVAChart();
  }
  
  // Show that we've made changes that we need to now save
  resetSaveButton();
}
