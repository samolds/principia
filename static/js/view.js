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
}
