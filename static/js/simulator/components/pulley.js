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
  bodyConstants[bodyConstants.length-1].attach_left  = canonicalTransform({x:data.x - dRadius, y:swapYpos(data.y, false)});
  bodyConstants[bodyConstants.length-1].attach_right = canonicalTransform({x:data.x + dRadius, y:swapYpos(data.y, false)});
  
  bodyConstants[bodyConstants.length-1].left_open = true;
  bodyConstants[bodyConstants.length-1].right_open = true;
  
  bodyConstants[bodyConstants.length-1].vectors = false;

  bodyConstants[bodyConstants.length-1].nickname = "pulley " + (getLabel(component));

  bodyConstants[bodyConstants.length-1].img = "/static/img/toolbox/pulley.png";
  bodyConstants[bodyConstants.length-1].size = dRadius;

  return [component];
}

function scalePulley(body, data)
{
  
}

function movePulley(data)
{
  var displaySize = 100/getScaleFactor();
  var dRadius = displaySize/2;
  Globals.bodyConstants[bIndex(data.body)].attach_left  = canonicalTransform({x:data.x - dRadius, y:data.y});
  Globals.bodyConstants[bIndex(data.body)].attach_right = canonicalTransform({x:data.x + dRadius, y:data.y});
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
          var position = pulley_const.right_open? pulley_const.attach_left: pulley_const.attach_right;         
          onPropertyChanged(i, "posx", position.x, false);
          onPropertyChanged(i, "posy", position.y, false);
          drawMaster();
        }
      }
    }
  } 
}

function applyPulleyForces(body, dt) { return [0,0]; }

// Applies pulley physics to the specified state object using specified pulley.
// Assumes that the caller has already identified 'state' as being attached to the pulley.
function applyPulley(body, dt)
{
  /*
  var bodies = Globals.world.getBodies();
  var pulleyConsts = body2Constant(pulley);
        
  // Make sure pulley has two bodies attached before applying special rules
  if(pulleyConsts.attachedBodyRight){
  
    // Get mass of each body
    var m1 = Globals.bodyConstants[pulleyConsts.attachedBodyLeft].mass;
    var m2 = Globals.bodyConstants[pulleyConsts.attachedBodyRight].mass;          
    
    // Magnitude of acceleration
    var pulley_a = (m1*Globals.gravity[1]*dt - m2*Globals.gravity[1]*dt)/(m1+m2);
    
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
    
  }*/
}
