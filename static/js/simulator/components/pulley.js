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

function getPulleyAcceleration(body, magnitude)
{
  var bodies = Globals.world.getBodies();
  var consts = body2Constant(body);
  if(!consts.side) return [0,0];
  
  var pulley = null;
  for(var i=0; i < consts.attachedTo.length; i++)
    if(bodyType(bodies[consts.attachedTo[i]]) == "kinematics1D-pulley")
      pulley = bodies[consts.attachedTo[i]];
    
  var radius = body2Constant(pulley).radius * ((consts.side == "left")? 1: -1);
  
  var canon = canonicalTransform({x:body.state.pos.x,y:body.state.pos.y});
  var x1 = canon.x;//body.state.pos.x;
  var x2 = Globals.variableMap[0][bIndex(pulley)].posx - radius;
  var y1 = canon.y;//swapYpos(body.state.pos.y, false) * getScaleFactor();
  var y2 = Globals.variableMap[0][bIndex(pulley)].posy;
  
  var x = x1-x2;
  var y = y1-y2;
  
  var getAngle = function(x,y) { return Math.atan2(y,x); }
  
  var m = consts.mass;
  var angle = -getAngle(x,y);
  return [(-Math.cos(angle) * magnitude)/m, (-Math.sin(angle) * magnitude)/m];
}

function applyPulleyForces(pulley_body, dt) { 
      
      var consts_original = body2Constant(pulley_body);
      var bodies = Globals.world.getBodies();
      
      if(!consts_original.side) return 0;
      
      var side = consts_original.side;
      
      var body = null;
      for(var i=0; i < consts_original.attachedTo.length; i++)
      {
        var index = consts_original.attachedTo[i];
        var pulley = bodies[index];
        if(bodyType(pulley) != "kinematics1D-pulley") continue;
        var pulley_consts = body2Constant(pulley);
        
        
        if(side == "left")
        {
          if(pulley_consts.attachedBodyRight){
            body = bodies[pulley_consts.attachedBodyRight];
          }
          else
            continue;            
        }
        else if(side == "right")
        {
          if(pulley_consts.attachedBodyLeft){
            body = bodies[pulley_consts.attachedBodyLeft];
          }
          else
            continue;
        }
      }      
      
      
      if(!body) return 0;
      
      var spring_a = applySpringForces(body);
      var state = body.state;              
      var x = 0;
      var y = 0;
      
      x += state.acc.x * dt + spring_a[0];
      y += state.acc.y * dt + spring_a[1];
      
      if(body.treatment == "dynamic"){
        x += Globals.gravity[0] * dt;
        y += Globals.gravity[1] * dt;
      }
      
      var m = body2Constant(body).mass;
      return Math.sqrt(Math.pow(x*m,2)+Math.pow(y*m,2));
}