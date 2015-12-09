function exportToJson()
{  
  // NOTE LIMIT OF 1500 chars
  var json = 
  {
    keyframeStates:Globals.keyframeStates, //TODO store keyframe states in separate fields, 1 per object per keyframe
    bodyConstants:Globals.bodyConstants,
    gravity:Globals.gravity,
    variableMap:Globals.variableMap,
    totalFrames:Globals.totalFrames,
    maxFrames:Globals.maxFrames,
    timelineReady:Globals.timelineReady
  }
  
  json = JSON.stringify(json);
  
  return json;
}

$(document).ready(function() {
  // Prepare event handling
  $('#properties-position-x').on("change", function(){ updatePropertyRedraw('posx', $('#properties-position-x').val()); }); 
  $('#properties-position-y').on("change", function(){ updatePropertyRedraw('posy', $('#properties-position-y').val()); }); 
  $('#properties-velocity-x').on("change", function(){ updatePropertyRedraw('velx', $('#properties-velocity-x').val()); }); 
  $('#properties-velocity-y').on("change", function(){ updatePropertyRedraw('vely', $('#properties-velocity-y').val()); }); 
  $('#properties-acceleration-x').on("change", function(){ updatePropertyRedraw('accx', $('#properties-acceleration-x').val()); }); 
  $('#properties-acceleration-y').on("change", function(){ updatePropertyRedraw('accy', $('#properties-acceleration-y').val()); });
  
  $('#properties-mass').on("change", function(){ updatePropertyRedraw('mass', $('#properties-mass').val()); }); 
  $('#properties-nickname').on("change", function(){ updatePropertyRedraw('nickname', $('#properties-nickname').val()); }); 
  $('#properties-img').on("change", function(){ updatePropertyRedraw('image', $('#properties-img option:selected')[0].value); });
  
  $('#solve-btn').on('click', function() { attemptSimulation(); });
  
  // MUST name keyframe divs using this format (splits on -)
  $('#keyframe-0').on("click", function(event) { selectKeyframe(event); } );
  $('#keyframe-1').on("click", function(event) { selectKeyframe(event); } );
  
  $('#keyframe-1-dt').on("change", function(){ 
    Globals.keyframeTimes[1] = parseFloat($('#keyframe-1-dt').val()) || "?"; 
    $('#keyframe-1-dt').val(Globals.keyframeTimes[1]);
    if(Globals.keyframeTimes[1] == "?") Globals.keyframeTimes[1] = false;
  });

  $('#glob-xaccel').val(Globals.gravity[0]);
  $('#glob-yaccel').val(Globals.gravity[1]);
  
  $('#glob-xaccel').on("change", function(){ updatePropertyRedraw('gravityx', $('#glob-xaccel').val()); }); 
  $('#glob-yaccel').on("change", function(){ updatePropertyRedraw('gravityy', $('#glob-yaccel').val()); }); 
});
