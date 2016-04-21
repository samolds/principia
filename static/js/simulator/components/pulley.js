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
  
  var displaySize = 100/getScaleFactor();
  var dRadius = displaySize/2;
  
  // Default image: use pointmass image. Can be changed from select element.
  var img = document.createElement("img");
  img.setAttribute("src", "/static/img/toolbox/pulley.png");
  img.setAttribute("width", "" + displaySize);
  img.setAttribute("height", "" + displaySize);
  
  // Generate the primary component (equilibrium point) and its child (point stretched to)
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

  // Variables associated with pulley
  if(!Globals.loading){
    addToVariableMap(
      {
        r: dRadius,
        posx: data.x, 
        posy: data.y
      }
    );
  }
  
  
  
  world.add(component);
  updateKeyframes([component]);
  Globals.pulleyBodyCounter++;
  
  bodyConstants[bodyConstants.length-1].radius = dRadius;  
  bodyConstants[bodyConstants.length-1].attach_left  = canonicalTransformNT({x:data.x - dRadius, y:swapYpos(data.y, false)});
  bodyConstants[bodyConstants.length-1].attach_right = canonicalTransformNT({x:data.x + dRadius, y:swapYpos(data.y, false)});
  
  bodyConstants[bodyConstants.length-1].left_open = true;
  bodyConstants[bodyConstants.length-1].right_open = true;
  
  bodyConstants[bodyConstants.length-1].vectors = false;

  bodyConstants[bodyConstants.length-1].nickname = "pulley " + (getLabel(component));

  bodyConstants[bodyConstants.length-1].img = "/static/img/toolbox/pulley.png";
  bodyConstants[bodyConstants.length-1].size = dRadius;

  return [component];
}

function movePulley(data)
{
  var displaySize = 100/getScaleFactor();
  var dRadius = displaySize/2;
  
  var consts = Globals.bodyConstants[bIndex(data.body)];
  consts.attach_left  = canonicalTransform({x:data.x - dRadius, y:data.y});
  consts.attach_right = canonicalTransform({x:data.x + dRadius, y:data.y});
  
  var bodies = Globals.world.getBodies();
  if(consts.attachedBodyLeft)
    onPropertyChanged(consts.attachedBodyLeft, "posx", consts.attach_left.x, false);
  if(consts.attachedBodyRight)
    onPropertyChanged(consts.attachedBodyRight, "posx", consts.attach_right.x, false);
  
}

function attachPulley(body){
  var world = Globals.world;
  var bodies = world.getBodies();
  var kState = Globals.keyframeStates[Globals.keyframe];
  var i = bIndex(body);
  var delta = Globals.delta;

  var constants = body2Constant(body);
  
  for(var j=1; j<bodies.length; j++){
    var pulley = bodies[j];
    var pulley_const = body2Constant(pulley);    
        
    if(distance(body.state.pos.x, body.state.pos.y, pulley.state.pos.x, pulley.state.pos.y) <= delta){
      if(constants.ctype == "kinematics1D-mass" && pulley_const.ctype == "kinematics1D-pulley" && !constants.side){
        
        var changed = false;
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

        if(changed){
          // Attempt to update the corresponding variable
          body.treatment = "ghost";
          var position = pulley_const.right_open? pulley_const.attach_left: pulley_const.attach_right;          
          onPropertyChanged(i, "posx", position.x, false);
          onPropertyChanged(i, "posy", position.y, false);
          drawMaster();
        }
      }
    }
  } 
}

function getPulleyAcceleration(body, magnitude)
{
  var bodies = Globals.world.getBodies();
  var consts = body2Constant(body);
  if(!consts.side) return [0,0];
  
  var pulley = null;
  for(var i=0; i < consts.attachedTo.length; i++)
    if(bodyType(bodies[consts.attachedTo[i]]) == "kinematics1D-pulley")
      pulley = bodies[consts.attachedTo[i]];

  return [0, -magnitude];
  
  // G1  - G2 = (m1+m2) a
}

function getPulleySnapX(body){
  var pulley = getAttachedPulley(body);
  if(pulley){
    var side = body2Constant(body).side;
    if(side == "left")
      return body2Constant(pulley).attach_left.x
    else
      return body2Constant(pulley).attach_right.x
  }
}

function snapToPulley(body){
  var pulley = getAttachedPulley(body);
  if(pulley){
    var snapX = getPulleySnapX(body);
    onPropertyChanged(bIndex(body), "posx", snapX, false);
  }
}

function handlePulleyStop(pulley, body){
  var init_y = Globals.keyframeStates[getKF()][bIndex(body)].pos.y;
  var pulley_y = pulley.state.pos.y;
  
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
  
  if(init_y > pulley_y && body.state.pos.y < pulley_y){
    stop(body, pulley_y);    
  }
  if(init_y == pulley.state.pos.y){
    stop(body, pulley_y);
  }
  if(init_y < pulley_y && body.state.pos.y > pulley_y){
    stop(body, pulley_y);
  }  
}

function getAttachedPulley(body){
  var pulley = null;
  var attachedTo = body2Constant(body).attachedTo;
  var bodies = Globals.world.getBodies();
  if(attachedTo)
    for(var i=0; i<attachedTo.length; i++)
      if(bodyType(bodies[attachedTo[i]]) == "kinematics1D-pulley")
        pulley = bodies[attachedTo[i]];
      
  return pulley;
}

function getOppositePulleyBody(body){
  var opp_body = null;
  var pulley = null;
  var bodies = Globals.world.getBodies();
  var side = body2Constant(body).side;  
  var attachedTo = body2Constant(body).attachedTo;
  
  if(!side) return null;
  
  for(var i=0; i < attachedTo.length; i++){
    var index = attachedTo[i];
    pulley = bodies[index];
                    
    if(bodyType(pulley) != "kinematics1D-pulley") continue;
    var pulley_consts = body2Constant(pulley);

    if(side == "left" && pulley_consts.attachedBodyRight)    
      return bodies[pulley_consts.attachedBodyRight];    
    else if(side == "right" && pulley_consts.attachedBodyLeft)
      return bodies[pulley_consts.attachedBodyLeft];    
  }
  
  return null;
}

function applyPulleyForces(body, dt){
        
  var bodies = Globals.world.getBodies();
  var pulley = getAttachedPulley(body);
  var opp_body = getOppositePulleyBody(body);
  
  if(!pulley || !opp_body || !body2Constant(pulley).solve_tension) return 0;
  
  body2Constant(pulley).solve_tension = false;
  
  // Sum up forces acting on each side
  var m1 = body2Constant(opp_body).mass;
  var spring_f1 = getSpringForce(opp_body);
  var F1 = (Globals.variableMap[getKF()][bIndex(opp_body)].accy * m1 * dt) - spring_f1[1] - (Globals.gravity[1] * dt * m1);
  
  var m2 = body2Constant(body).mass;
  var spring_f2 = getSpringForce(body);
  var F2 = (Globals.variableMap[getKF()][bIndex(body)].accy * m2 * dt) - spring_f2[1] - (Globals.gravity[1] * dt * m2);
  
  if(opp_body.state.pos.y == pulley.state.pos.y) F1 = F2;
  if(body.state.pos.y == pulley.state.pos.y) F2 = F1;
      
  var a = Math.abs((F2 - F1)/(m1+m2));
  
  if( F1 > F2){
    body.state.vel.y += a;
    opp_body.state.vel.y -= a;
  }
  else {
    body.state.vel.y -= a;
    opp_body.state.vel.y += a;
  }
  
  var side = body2Constant(body).side;
  if(side == "left"){
    var dF = F1 - F2;
    pulley.state.angular.pos = dF/5;
  }
  
  return 0;
}