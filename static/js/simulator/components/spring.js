/*
  spring.js --
  This file defines functions related to 'spring' physics components.
*/

// Add a spring component to current world using the specified coordinates
function addSpring(data)
{
  var world = Globals.world;
  var variableMap = Globals.variableMap;
  var bodyConstants = Globals.bodyConstants;
  
  // Generate the primary component (equilibrium point) and its child (point stretched to)
  // Note that 'ghost' is a new treatment that ignores collisions
  var component = Physics.body('circle', {
              treatment:"ghost",
              x: data.x,
              y: data.y,           
              radius: 6,
              styles: {
                fillStyle: '#000000',
              }
            });
            
  var componentChild = Physics.body('circle', {
              treatment:"ghost",
              x: data.x+120,
              y: data.y,             
              radius: 6,                    
              styles: {
                fillStyle: '#000000',
              }
            });
            
  // Variables associated with spring
  addToVariableMap(
    {
      k: 0.01
    }
  );
  
  // Variables associated with stretched point
  addToVariableMap(
    {
      posx: data.x, 
      posy: data.y
    }
  );
  
  world.add(component);
  world.add(componentChild);
  
  bodyConstants[bodyConstants.length-2].child = world.getBodies().indexOf(componentChild);
  bodyConstants[bodyConstants.length-1].parent = world.getBodies().indexOf(component);
  bodyConstants[bodyConstants.length-1].vectors = false;
  bodyConstants[bodyConstants.length-2].k = 0.01;
  bodyConstants[bodyConstants.length-2].vectors = false;
  
  updateKeyframes([component, componentChild]);
  
  return [component, componentChild];
}

// Applies spring forces to the specified body and returns corresponding acceleration in [x,y]
function applySpringForces(body) {
    var a = [0,0];    
    var constants = body2Constant(body)
    
    // Skip bodies not attached to a spring
    if(constants.attachedTo){
      var attached = Globals.world.getBodies()[constants.attachedTo];
      var spring_idx = Globals.bodyConstants[constants.attachedTo].parent;
      var spring = Globals.world.getBodies()[spring_idx]; // The parent element represents the equilibrium point
      var properties = body2Constant(spring);
      
      // Recall: F=m*a -> a = F/m and F =-k*x so a = -k*x/m
      var origin = [spring.state.pos.x, spring.state.pos.y];     
      var springFx = -properties.k * (attached.state.pos.x - origin[0]);
      var springFy = -properties.k * (attached.state.pos.y - origin[1]);
      a[0] = springFx / body2Constant(body).mass;
      a[1] = springFy / body2Constant(body).mass;
    }
    
  return a;
}

// Removes relationship between body and spring it is currently assigned to if it is delta units away.
function detachSpring(body){
  var world = Globals.world;
  var delta = 50;
  
  if(body2Constant(body).attachedTo || body2Constant(body).attachedTo === 0)
  {
    var attachedTo = world.getBodies()[body2Constant(body).attachedTo];
    if(distance(body.state.pos.x, body.state.pos.y, attachedTo.state.pos.x, attachedTo.state.pos.y) > delta) {        
        delete body2Constant(attachedTo).attachedBody;
        delete body2Constant(body).attachedTo;
    }
  }
}

// Adds relationship between body and spring if it is within delta units to the stretched point
function attachSpring(body){  
  var world = Globals.world;
  var bodies = world.getBodies();
  var kState = Globals.keyframeStates[Globals.keyframe];
  var i = world.getBodies().indexOf(body);
  var delta = Globals.delta;
  
  for(var j=0; j<bodies.length; j++){
    var attachBody = bodies[j];
    
    // Prevent multiple bodies from attaching to the same spring
    if(body2Constant(attachBody).attachedBody) continue;
    
    if(distance(body.state.pos.x, body.state.pos.y, attachBody.state.pos.x, attachBody.state.pos.y) <= delta){
      if(body2Constant(body).ctype == "kinematics1D-mass" && body2Constant(attachBody).ctype == "kinematics1D-spring-child"){
        body2Constant(attachBody).attachedBody = bodies.indexOf(body);
        body2Constant(body).attachedTo = bodies.indexOf(attachBody);
        
        kState[i].pos.x = attachBody.state.pos.x;
        kState[i].pos.y = attachBody.state.pos.y;
        body.state.pos.x = attachBody.state.pos.x;
        body.state.pos.y = attachBody.state.pos.y;             
             
        // Attempt to update the corresponding variable
        if(Globals.useKeyframes) updateVariable(body, "posx", attachBody.state.pos.x);
        if(Globals.useKeyframes) updateVariable(body, "posy", attachBody.state.pos.y);        
      }
    }
  }
}
