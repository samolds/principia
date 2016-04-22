/*
  origin.js --
  This file defines functions related to the special 'origin' physics component
*/

/* 
  Moves origin component to current world using the specified coordinates
  These coordinates are relative to bottom-left as 0,0 (before panning)
  Current translation is ignored if doTranslate is true
*/
function moveOrigin(data, doTranslate){
  
  // Apply global translation if this flag is set
  // Useful for if placing the origin directly using pixel coordinates
  if(doTranslate){
    data.x -= Globals.translation.x;
    data.y += Globals.translation.y;
  }
  
  var world = Globals.world;
  var bodies = world.getBodies();
  var delta = Globals.delta;
  
  // Attach the origin to a body if within delta pixels
  var detach = true; // The origin will detach from a body
  for(var j=1; j<bodies.length; j++){ // Start at 1 so the origin isn't attached to its representation!
    var body = bodies[j];
    
    // Find a close enough body:
    if(distance(body.state.pos.x, swapYpos(body.state.pos.y, false), data.x, data.y) <= delta){
      detach = false;
      
      // Skip attempting to attach to a body if moving a body that the origin is already attached to
      if(Globals.originObject !== false && Globals.didMove && j != Globals.originObject)
        continue;
      
      Globals.originObject = j;
      
      // Select the body the origin was attached to
      if(bIndex(Globals.selectedBody) === 0)
        Globals.selectedBody = bodies[j];
      
      // Update data to point to object position
      data.x = body.state.pos.x;
      data.y = swapYpos(body.state.pos.y, false);
      
      // Hide the origin representation while it is attached to something else
      Globals.world.getBodies()[0].hidden = true;
    }
  }
  
  // Unhide the origin and detach it from the body if it is moved too far away
  if(detach && (Globals.originObject !== false)){    
    Globals.originObject = false;
    Globals.world.getBodies()[0].hidden = false;
  }
  
  // Assign the global origin coordinates for recomputing object positions
  Globals.origin[0] = data.x;
  Globals.origin[1] = data.y;
  
  // Assign this new position to the origin object within each keyframe
  for(var i=0; i < Globals.keyframeStates.length; i++){
    Globals.keyframeStates[i][0].pos.x = pixelTransform(Globals.origin[0], "x");
    Globals.keyframeStates[i][0].pos.y = pixelTransform(Globals.origin[1], "y");
  }
    
  // Update the displayed origin coordinates  
  $("#glob-xorigin").val(Globals.origin[0]);
  $("#glob-yorigin").val(Globals.origin[1]);
  
  // Redraw the frame
  drawMaster();
}

/*
  Move origin in single coordinate ("x" or "y")
  Used when user types a value instead of using drag interface
*/
function moveOriginScalar(coordinate, value){
  
  // Ensure the value is a valid float
  value = parseFloat(value);  
  if(isNaN(value)) return;
  
  // Reassign the global origin coordinate
  if(coordinate == "x")
    Globals.origin[0] = value;
  else 
    Globals.origin[1] = value;
  
  // Utilize the moveOrigin function using new global coordinates;
  // do not translate the specified coordinates
  moveOrigin({"x":Globals.origin[0],"y":Globals.origin[1]}, false);
}
