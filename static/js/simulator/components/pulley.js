/*
  pulley.js --
  This file defines functions related to 'pulley' physics components
*/

/*
  Add a pulley component to current world using the specified canonical coordinates in the data object
  This function sets up associated constants and variables and returns the PhysicsJS component that was added
*/
function addPulley(data){

  var world = Globals.world;
  var variableMap = Globals.variableMap;
  var bodyConstants = Globals.bodyConstants;

  // Default radius is scaled according to the pulley's displayed size
  var displaySize = 100/getScaleFactor();
  var dRadius = displaySize/2;
  
  // Default image: use pointmass image. Can be changed from select element.
  var img = document.createElement("img");
  img.setAttribute("src", "/static/img/toolbox/pulley.png");
  img.setAttribute("width", "" + displaySize);
  img.setAttribute("height", "" + displaySize);
  
  // Generate the pulley as a PhysicsJS component
  // Note that 'ghost' is a new treatment that ignores collisions
  var component = Physics.body('circle', {
              treatment:"ghost",
              x: pixelTransform(data.x, "x"),
              y: pixelTransform(data.y, "y"),
              radius: dRadius,
              view: img,
              styles: {
                fillStyle: '#4d4d4d',
                angleIndicator: '#ffffff'
              }
            });

  // Variables associated with the pulley
  // Note that r is constant regardless of scale/panning!
  if(!Globals.loading){
    addToVariableMap(
      {
        r: 50,
        posx: data.x, 
        posy: data.y
      }
    );
  }
  
  // Add the component to the world and update all keyframes
  world.add(component);
  updateKeyframes([component]);
  Globals.pulleyBodyCounter++;
  
  // Canonical coordinates for the pulley and the points that bodies attach to
  bodyConstants[bodyConstants.length-1].radius = 50;
  bodyConstants[bodyConstants.length-1].attach_left  = {x: data.x-50, y:data.y};
  bodyConstants[bodyConstants.length-1].attach_right = {x: data.x+50, y:data.y};
  
  // These constants are used to determine if a slot is available to attach to
  bodyConstants[bodyConstants.length-1].left_open = true;
  bodyConstants[bodyConstants.length-1].right_open = true;
  
  // Standard constants: Vector display toggle, nickname, pulley display image and image size
  bodyConstants[bodyConstants.length-1].vectors = false;
  bodyConstants[bodyConstants.length-1].nickname = "pulley " + (getLabel(component));
  bodyConstants[bodyConstants.length-1].img = "/static/img/toolbox/pulley.png";
  bodyConstants[bodyConstants.length-1].size = 50;

  return [component];
}

/*
  This function should be called whenever a pulley is moved to ensure
  that any attached objects are also moved.
  
  Assumes data contains the pulley object and the pixel coordinates of where it was moved
*/
function movePulley(data)
{
  // Compute the radius of the pulley at the current scale factor
  var displaySize = 100/getScaleFactor();
  var dRadius = displaySize/2;
  
  // Do a canonical transform and assign the new points bodies should attach to
  var consts = Globals.bodyConstants[bIndex(data.body)];
  consts.attach_left  = canonicalTransform({x:data.x - dRadius, y:data.y});
  consts.attach_right = canonicalTransform({x:data.x + dRadius, y:data.y});
  
  var bodies = Globals.world.getBodies();
  
  // Update the body on the left side of the pulley component
  var modx = Globals.didMove? (Globals.translation.x * getScaleFactor()): 0;  
  
  if(consts.attachedBodyLeft){
    onPropertyChanged(consts.attachedBodyLeft, "posx", consts.attach_left.x, false);
    
    // Update any springs attached to the left side body
    var attachedToLeft = Globals.bodyConstants[consts.attachedBodyLeft].attachedTo;
    for(var i=0; i < attachedToLeft.length; i++){
      var body = bodies[attachedToLeft[i]];
      if(bodyType(body) == "kinematics1D-spring-child")
        onPropertyChanged(bIndex(body), "posx", consts.attach_left.x + modx, false);
    }
  }
  
  // Update the body on the right side of the pulley component
  if(consts.attachedBodyRight){
    onPropertyChanged(consts.attachedBodyRight, "posx", consts.attach_right.x, false);
    
    // Update any springs attached to the right side body
    var attachedToRight = Globals.bodyConstants[consts.attachedBodyRight].attachedTo;
    for(var i=0; i < attachedToRight.length; i++){
      var body = bodies[attachedToRight[i]];
      if(bodyType(body) == "kinematics1D-spring-child")
        onPropertyChanged(bIndex(body), "posx", consts.attach_right.x + modx, false);
    }
  }
}

/*
  Attaches the specified body to the first pulley object within delta pixels
*/
function attachPulley(body){
  var world = Globals.world;
  var bodies = world.getBodies();
  var kState = Globals.keyframeStates[Globals.keyframe];
  var i = bIndex(body);
  var delta = Globals.delta;

  // Constants associated with the body being attached
  var constants = body2Constant(body);
  
  // Loop through all bodies except the origin
  for(var j=1; j<bodies.length; j++){
    
    // The current body is a candidate pulley until the next conditional fails
    var pulley = bodies[j];
    var pulley_const = body2Constant(pulley);    
          
    // If the current body is an unattached mass, the target body is a pulley, and the distance is within delta pixels
    if(distance(body.state.pos.x, body.state.pos.y, pulley.state.pos.x, pulley.state.pos.y) <= delta){
      if(constants.ctype == "kinematics1D-mass" && pulley_const.ctype == "kinematics1D-pulley" && !constants.side){
        
        var changed = false;
        
        // Attempt to attach the body to the first available slot
        // Mark the slot as unavailable and map the pulley and mass to each other
        if(body2Constant(pulley).left_open)
        {              
          pulley_const.attachedBodyLeft = bIndex(body);
          pulley_const.left_open = false;
          constants.attachedTo.push(bIndex(pulley));
          constants.side = "left";
          changed = true;          
        }
        else if(body2Constant(pulley).right_open)
        {        
          pulley_const.attachedBodyRight = bIndex(body);
          pulley_const.right_open = false;
          constants.attachedTo.push(bIndex(pulley));
          constants.side = "right";
          changed = true;
        }

        // If a slot was available:
        if(changed)
        {
          // Attempt to update the corresponding variable
          body.treatment = "ghost"; // The mass will no longer collide
          
          // Update the position of hte mass and redraw the frame
          var position = pulley_const.right_open? pulley_const.attach_left: pulley_const.attach_right;          
          onPropertyChanged(i, "posx", position.x, false);
          onPropertyChanged(i, "posy", position.y, false);
          drawMaster();
        }
      }
    } // End outer conditionals (was valid target)
  } // End loop over possible targets
}

/*
  Returns an acceleration vector after applying a force
  of the specified magnitude to the specified body
*/
function getPulleyAcceleration(body, magnitude)
{
  var bodies = Globals.world.getBodies();
  var consts = body2Constant(body);
  if(!consts.side) return [0,0];
  
  // Acquire the pulley the body is attached to
  var pulley = null;
  for(var i=0; i < consts.attachedTo.length; i++)
    if(bodyType(bodies[consts.attachedTo[i]]) == "kinematics1D-pulley")
      pulley = bodies[consts.attachedTo[i]];

  // Invert the specified magnitude and return the [x,y] vector array
  return [0, -magnitude];  
}

/*
  Gets the canonical x coordinate the specified body should snap to,
  with an undefined return value if the body is not attached to a pulley
*/
function getPulleySnapX(body){
  
  // Get the pulley the body is attached to (or null)
  var pulley = getAttachedPulley(body);
  
  // If it was attached, return the x coordinate of the corresponding side
  if(pulley){
    var side = body2Constant(body).side;
    if(side == "left")
      return body2Constant(pulley).attach_left.x
    else
      return body2Constant(pulley).attach_right.x
  }
}

/*
  Snaps the specified body to stay vertically aligned with its pulley
*/
function snapToPulley(body){
  var pulley = getAttachedPulley(body);
  if(pulley){
    var snapX = getPulleySnapX(body);
    onPropertyChanged(bIndex(body), "posx", snapX, false);
  }
}

/*
  Handle the case that a body reaches the point it is attached to on the pulley,
  causing it to stop.
*/
function handlePulleyStop(pulley, body){
  
  // Find the intial y values of the body and the pulley
  var init_y = Globals.keyframeStates[getKF()][bIndex(body)].pos.y;
  var pulley_y = pulley.state.pos.y;
  
  // Internal helper function to fix maximum y and zero out any motion
  // The real-life equivalent is an increase in tension and a normal force
  // as the object is stopped up against the pulley
  function stop(body, y){
    body.state.pos.y = y;
    body.state.vel.x = 0;
    body.state.vel.y = 0;
    body.state.acc.x = 0;
    body.state.acc.y = 0;
    
    var opp_body = getOppositePulleyBody(body);
    if(opp_body){
      opp_body.state.vel.x = 0;
      opp_body.state.vel.y = 0;
      opp_body.state.acc.x = 0;
      opp_body.state.acc.y = 0;
    }
  }
  
  // Body started below the pulley but now exceeds it in height
  if(init_y > pulley_y && body.state.pos.y < pulley_y){
    stop(body, pulley_y);    
  }
  
  // Body started at the pulley and is immediately stopped against it
  if(init_y == pulley.state.pos.y){
    stop(body, pulley_y);
  }
  
  // Body started above the pulley and has fallen below it
  if(init_y < pulley_y && body.state.pos.y > pulley_y){
    stop(body, pulley_y);
  }  
}

/*
  Gets the pulley this body is attached to or null
*/
function getAttachedPulley(body){
  var pulley = null;
  
  // Loop through all attached bodies and return a pulley if there is one
  var attachedTo = body2Constant(body).attachedTo;
  var bodies = Globals.world.getBodies();
  if(attachedTo)
    for(var i=0; i<attachedTo.length; i++)
      if(bodyType(bodies[attachedTo[i]]) == "kinematics1D-pulley")
        pulley = bodies[attachedTo[i]];
      
  return pulley;
}

/*
  Gets the body attached to the opposite side of the pulley the specified body is 
  attached to or null
*/
function getOppositePulleyBody(body){
  var opp_body = null;
  var pulley = null;
  var bodies = Globals.world.getBodies();
  var side = body2Constant(body).side;  
  var attachedTo = body2Constant(body).attachedTo;
  
  // The specified body is not attached to a pulley
  if(!side) return null;
  
  // Loop through target bodies
  for(var i=0; i < attachedTo.length; i++){
    var index = attachedTo[i];
    pulley = bodies[index];
                    
    // The target is not a pulley
    if(bodyType(pulley) != "kinematics1D-pulley") continue;
    
    // Otherwise, return the body on the opposite side
    var pulley_consts = body2Constant(pulley);
    if(side == "left" && pulley_consts.attachedBodyRight)    
      return bodies[pulley_consts.attachedBodyRight];    
    else if(side == "right" && pulley_consts.attachedBodyLeft)
      return bodies[pulley_consts.attachedBodyLeft];    
  }
  
  // There was no body on the opposite side
  return null;
}

/*
  Applies an acceleration to the specified body using the specified dt value 
*/
function applyPulleyForces(body, dt){
        
  var bodies = Globals.world.getBodies();
  var pulley = getAttachedPulley(body);
  var opp_body = getOppositePulleyBody(body);
  
  // If the specified body is not attached to a pulley, there is no opposing body, or tension has
  // already been solved for, return 0
  if(!pulley || !opp_body || !body2Constant(pulley).solve_tension) return 0;
  
  // Lower solve tension flag so the bodies are only modified once
  body2Constant(pulley).solve_tension = false;
  
  // Sum up forces acting on each side
  
  // Opposing force:
  var m1 = body2Constant(opp_body).mass;
  var spring_f1 = getSpringForce(opp_body);
  var F1 = (Globals.variableMap[getKF()][bIndex(opp_body)].accy * m1 * dt) - spring_f1[1] - (Globals.gravity[1] * dt * m1);
  
  // Current force:
  var m2 = body2Constant(body).mass;
  var spring_f2 = getSpringForce(body);
  var F2 = (Globals.variableMap[getKF()][bIndex(body)].accy * m2 * dt) - spring_f2[1] - (Globals.gravity[1] * dt * m2);
  
  // If either body has reached the pulley, cancel out the forces
  if(opp_body.state.pos.y == pulley.state.pos.y) F1 = F2;
  if(body.state.pos.y == pulley.state.pos.y) F2 = F1;
    
  // The acceleration magnitude is the current force minus the opposing force over the total
  // mass of the system
  var a = Math.abs((F2 - F1)/(m1+m2));
  
  // Invert the direction of the acceleration according to the magnitude of the forces
  if( F1 > F2){
    body.state.vel.y += a;
    opp_body.state.vel.y -= a;
  }
  else {
    body.state.vel.y -= a;
    opp_body.state.vel.y += a;
  }
  
  // For fun: change the position of the pulley so it appears to spin based on the force differential;
  // currently pulleys are assumed to be massless and frictionless so this wouldn't really happen!
  var side = body2Constant(body).side;
  if(side == "left"){
    var dF = F1 - F2;
    pulley.state.angular.pos = dF/5;
  }
  
  // [Return value is no longer used]
  return 0;
}