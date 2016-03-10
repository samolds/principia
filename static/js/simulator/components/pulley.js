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

  // Default image: use pointmass image. Can be changed from select element.
  var img = document.createElement("img");
  img.setAttribute("src", "/static/img/toolbox/pulley.png");
  img.setAttribute("width", "100");
  img.setAttribute("height", "100");
  
  // Generate the primary component (equilibrium point) and its child (point stretched to)
  // Note that 'ghost' is a new treatment that ignores collisions
  var component = Physics.body('circle', {
              treatment:"ghost",
              x: data.x,
              y: data.y,
              radius: dRadius,
              view: img,
              styles: {
                fillStyle: '#4d4d4d',
                angleIndicator: '#ffffff'
              }
            });

  // Variables associated with pulley
  addToVariableMap(
    {
      r: dRadius,
      posx: data.x, 
      posy: data.y
    }
  );
  
  
  
  world.add(component);
  updateKeyframes([component]);
  Globals.pulleyBodyCounter++;
  
  bodyConstants[bodyConstants.length-1].radius = dRadius;  
  bodyConstants[bodyConstants.length-1].attach_left  = [data.x - dRadius, data.y];
  bodyConstants[bodyConstants.length-1].attach_right = [data.x + dRadius, data.y];
  
  bodyConstants[bodyConstants.length-1].left_open = true;
  bodyConstants[bodyConstants.length-1].right_open = true;
  
  bodyConstants[bodyConstants.length-1].vectors = false;

  bodyConstants[bodyConstants.length-1].nickname = "pulley " + (getLabel(component));

  bodyConstants[bodyConstants.length-1].img = "/static/img/toolbox/pulley.png";
  bodyConstants[bodyConstants.length-1].size = dRadius;

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
    var changed = false;
        
    if(distance(body.state.pos.x, body.state.pos.y, pulley.state.pos.x, pulley.state.pos.y) <= delta){
      if(body2Constant(body).ctype == "kinematics1D-mass" && body2Constant(pulley).ctype == "kinematics1D-pulley"){
        
        if(body2Constant(pulley).left_open)
        {        
          body2Constant(pulley).attachedBodyLeft = bIndex(body);
          body2Constant(body).attachedTo = bIndex(pulley);
          body2Constant(body).side = "left";
          body2Constant(pulley).left_open = false;
          
          kState[i].pos.x = body2Constant(pulley).attach_left[0];
          kState[i].pos.y = body2Constant(pulley).attach_left[1];
          body.state.pos.x = body2Constant(pulley).attach_left[0];
          body.state.pos.y = body2Constant(pulley).attach_left[1];          
          
          changed = true;
        }        
        else if(body2Constant(pulley).right_open)
        {        
          body2Constant(pulley).attachedBodyRight = bIndex(body);
          body2Constant(body).attachedTo = bIndex(pulley);
          body2Constant(body).side = "right";
          body2Constant(pulley).right_open = false;
          
          kState[i].pos.x = body2Constant(pulley).attach_right[0];
          kState[i].pos.y = body2Constant(pulley).attach_right[1];
          body.state.pos.x = body2Constant(pulley).attach_right[0];
          body.state.pos.y = body2Constant(pulley).attach_right[1];          
          
          changed = true;
        }
        
        
        if(changed){
          // Attempt to update the corresponding variable
          updateVariable(body, "posx", body.state.pos.x);
          updateVariable(body, "posy", body.state.pos.y);
        }
      }
    }
  } 
}

// Applies pulley physics to the specified state object using specified pulley.
// Assumes that the caller has already identified 'state' as being attached to the pulley.
function applyPulley(pulley, state, consts, dt)
{
  var bodies = Globals.world.getBodies();
  var pulleyConsts = body2Constant(pulley);
        
  // Make sure pulley has two bodies attached before applying special rules
  if(pulleyConsts.attachedBodyRight === 0 || pulleyConsts.attachedBodyRight){
  
    // Undo effect of gravity  
    state.vel.y -= Globals.gravity[1] * dt;

    // Get mass of each body
    var m1 = Globals.bodyConstants[pulleyConsts.attachedBodyLeft].mass;
    var m2 = Globals.bodyConstants[pulleyConsts.attachedBodyRight].mass;          
    
    // Magnitude of acceleration
    var pulley_a = Math.abs(m1*Globals.gravity[1] - m2*Globals.gravity[1])/(m1+m2);          
    
    // Ready to accelerate up, reverse direction if this is the heavier mass
    if(pulley_a < 0 && (consts.mass == m1 && m1 > m2) || (consts.mass == m2 && m2 > m1) )
      pulley_a *= -1;

    // Ready to accelerate down, reverse direction if this is the lighter mass
    if(pulley_a > 0 && (consts.mass == m1 && m1 < m2) || (consts.mass == m2 && m2 < m1) )
      pulley_a *= -1;
       
    // Just for fun, animate the pulley spinning
    if(m1 > m2 && Globals.gravity[1] != 0)
      pulley.state.angular.vel = -1 * (m1 - m2)/20.0;
    else if(m2 > m1 && Globals.gravity[1] != 0)
      pulley.state.angular.vel = (m2 - m1)/20.0;
       
    // Handle reaching the top?
    if((m1 < m2 && bodies[pulleyConsts.attachedBodyLeft].state.pos.y <= pulley.state.pos.y) ||(m1 > m2 && bodies[pulleyConsts.attachedBodyRight].state.pos.y <= pulley.state.pos.y)){
      pulley_a = 0;
      pulley.state.angular.vel = 0;
      
      bodies[pulleyConsts.attachedBodyLeft].state.vel.y = 0;
      bodies[pulleyConsts.attachedBodyRight].state.vel.y = 0;
    }
       
    // Add effect of pulley    
    state.vel.y += pulley_a;
  }
}
