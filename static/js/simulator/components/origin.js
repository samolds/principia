/*
  origin.js --
  This file defines functions related to the special 'origin' physics component
*/

// Moves component to current world using the specified coordinates
// These coordinates are relative to bottom-left as 0,0
function moveOrigin(data, doTranslate){
  
  if(doTranslate){
    data.x -= Globals.translation.x;
    data.y += Globals.translation.y;
  }
  
  var world = Globals.world;
  var bodies = world.getBodies();
  var delta = Globals.delta;
  
  // Attach the origin to a body if within delta pixels
  var detach = true;
  for(var j=1; j<bodies.length; j++){ // Start at 1 so the origin isn't attached to its representation!
    var body = bodies[j];
    if(distance(body.state.pos.x, swapYpos(body.state.pos.y, false), data.x, data.y) <= delta){
      detach = false;
      if(Globals.originObject !== false && Globals.didMove && j != Globals.originObject) continue;
      Globals.originObject = j;
      
      if(bIndex(Globals.selectedBody) === 0)
        Globals.selectedBody = bodies[j];
      
      // Update data to point to object position
      data.x = body.state.pos.x;
      data.y = swapYpos(body.state.pos.y, false);
      
      Globals.world.getBodies()[0].hidden = true;
    }
  }
  
  if(detach && (Globals.originObject !== false)){    
    Globals.originObject = false;
    Globals.world.getBodies()[0].hidden = false;
  }
  
  Globals.origin[0] = data.x;
  Globals.origin[1] = data.y;
  
  for(var i=0; i < Globals.keyframeStates.length; i++){
    Globals.keyframeStates[i][0].pos.x = pixelTransform(Globals.origin[0], "x");
    Globals.keyframeStates[i][0].pos.y = pixelTransform(Globals.origin[1], "y");
  }
    
  $("#glob-xorigin").val(Globals.origin[0]);
  $("#glob-yorigin").val(Globals.origin[1]);
  
  drawMaster();
}

// Move origin in single coordinate (only when user types value!)
function moveOriginScalar(coordinate, value){
  
  value = parseFloat(value);
  
  if(isNaN(value)) return;
  
  if(coordinate == "x")
    Globals.origin[0] = value; //- Globals.translation.x;
  else 
    Globals.origin[1] = value; //- Globals.translation.y;
  
  moveOrigin({"x":Globals.origin[0],"y":Globals.origin[1]}, false);
}
