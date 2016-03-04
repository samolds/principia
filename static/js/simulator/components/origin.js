/*
  origin.js --
  This file defines functions related to the special 'origin' physics component
*/

// Moves component to current world using the specified coordinates
function moveOrigin(data){
  
  var world = Globals.world;
  var bodies = world.getBodies();
  var delta = Globals.delta;
  
  // Attach the origin to a body if within delta pixels
  var detach = true;
  for(var j=1; j<bodies.length; j++){ // Start at 1 so the origin isn't attached to its representation!
    var body = bodies[j];
    if(distance(body.state.pos.x, body.state.pos.y, data.x, data.y) <= delta){
      detach = false;
      Globals.originObject = j;
      
      if(bIndex(Globals.selectedBody) === 0)
        Globals.selectedBody = bodies[j];
      
      // Update data to point to object position
      data.x = body.state.pos.x;
      data.y = body.state.pos.y;
      
      Globals.world.getBodies()[0].hidden = true;
    }
  }
  
  if(detach && (Globals.originObject !== false))
  {    
    Globals.originObject = false;
    Globals.world.getBodies()[0].hidden = false;
  }
  
  Globals.origin[0] = data.x;
  Globals.origin[1] = data.y;
  
  $("#glob-xorigin").val(data.x); 
  $("#glob-yorigin").val(data.y);
  
  for(var i=0; i < Globals.keyframeStates.length; i++){
    Globals.keyframeStates[i][0].pos.x = Globals.origin[0];
    Globals.keyframeStates[i][0].pos.y = Globals.origin[1];
  }
  drawMaster();
}

// Move origin in single coordinate
function moveOriginScalar(coordinate, value){
  
  value = parseFloat(value);
  
  if(isNaN(value)) return;
  
  if(coordinate == "x"){
    Globals.origin[0] = value;
  }
  else {
    Globals.origin[1] = value;
  }
  
  moveOrigin({"x":Globals.origin[0],"y":Globals.origin[1]});
}
