/*
  pulley.js --
  This file defines functions related to 'pulley' physics components.
*/

// Add a pulley component to current world using the specified coordinates
function addPulley(data){

  var world = Globals.world;
  var variableMap = Globals.variableMap;
  var bodyConstants = Globals.bodyConstants;

  // Default radius
  var dRadius = 50;  
  
  // Generate the primary component (equilibrium point) and its child (point stretched to)
  // Note that 'ghost' is a new treatment that ignores collisions
  var component = Physics.body('circle', {
              treatment:"ghost",
              x: data.x,
              y: data.y,           
              radius: dRadius,
              styles: {
                fillStyle: '#6c71c4',
                angleIndicator: '#3b3e6b'
              }
            });

  // Variables associated with pulley
  addToVariableMap(
    {
      r: dRadius
    }
  );
  
  
  
  world.add(component);
  
  
  bodyConstants[bodyConstants.length-1].radius = dRadius;  
  bodyConstants[bodyConstants.length-1].attach_left  = [data.x - dRadius, data.y];
  bodyConstants[bodyConstants.length-1].attach_right = [data.x + dRadius, data.y];
  
  bodyConstants[bodyConstants.length-1].left_open = true;
  bodyConstants[bodyConstants.length-1].right_open = true;
  
  bodyConstants[bodyConstants.length-1].vectors = false;
  
  updateKeyframes([component]);
  
  return [component];
}

function attachPulley(body){
 var world = Globals.world;
  var bodies = world.getBodies();
  var kState = Globals.keyframeStates[Globals.keyframe];
  var i = bIndex(body);
  var delta = Globals.delta;
  
  for(var j=0; j<bodies.length; j++){
    var pulley = bodies[j];
    
        
    if(distance(body.state.pos.x, body.state.pos.y, pulley.state.pos.x, pulley.state.pos.y) <= delta){
      if(body2Constant(body).ctype == "kinematics1D-mass" && body2Constant(pulley).ctype == "kinematics1D-pulley"){
        
        if(body2Constant(pulley).left_open)
        {        
          body2Constant(pulley).attachedBodyLeft = bodies.indexOf(body);
          body2Constant(body).attachedTo = bodies.indexOf(pulley);
          body2Constant(body).side = "left";
          body2Constant(pulley).left_open = false;
          
          kState[i].pos.x = body2Constant(pulley).attach_left[0];
          kState[i].pos.y = body2Constant(pulley).attach_left[1];
          body.state.pos.x = body2Constant(pulley).attach_left[0];
          body.state.pos.y = body2Constant(pulley).attach_left[1];
        }        
        else if(body2Constant(pulley).right_open)
        {        
          body2Constant(pulley).attachedBodyRight = bodies.indexOf(body);
          body2Constant(body).attachedTo = bodies.indexOf(pulley);
          body2Constant(body).side = "right";
          body2Constant(pulley).right_open = false;
          
          kState[i].pos.x = body2Constant(pulley).attach_right[0];
          kState[i].pos.y = body2Constant(pulley).attach_right[1];
          body.state.pos.x = body2Constant(pulley).attach_right[0];
          body.state.pos.y = body2Constant(pulley).attach_right[1];
        }
        
        
             
        // Attempt to update the corresponding variable
        if(Globals.useKeyframes) updateVariable(body, "posx", body.state.pos.x);
        if(Globals.useKeyframes) updateVariable(body, "posy", body.state.pos.y);        
      }
    }
  } 
}