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
  
  var radius = 6/getScaleFactor();
  
  // Generate the primary component (equilibrium point) and its child (point stretched to)
  // Note that 'ghost' is a new treatment that ignores collisions
  var component = Physics.body('circle', {
              treatment:"ghost",
              x: pixelTransform(data.x, "x"),
              y: pixelTransform(data.y, "y"),
              radius: radius,
              styles: {
                fillStyle: '#000000',
              }
            });
            
  var componentChild = Physics.body('circle', {
              treatment:"ghost",
              x: pixelTransform(data.x, "x")+120/getScaleFactor(),
              y: pixelTransform(data.y, "y"),
              radius: radius,
              styles: {
                fillStyle: '#000000',
              }
            });
       
  if(!Globals.loading){       
    // Variables associated with spring
    addToVariableMap(
      {
        posx: data.x,
        posy: data.y,
        k: 0.01
      }
    );
    
    // Variables associated with stretched point
    addToVariableMap(
      {
        posx: data.x+120, 
        posy: data.y
      }
    );
  }
  
  world.add(component);
  world.add(componentChild);
  updateKeyframes([component, componentChild]);
  Globals.springBodyCounter++;
  
  bodyConstants[bodyConstants.length-2].child = world.getBodies().indexOf(componentChild);
  bodyConstants[bodyConstants.length-1].parent = world.getBodies().indexOf(component);
  bodyConstants[bodyConstants.length-1].vectors = false;
  bodyConstants[bodyConstants.length-2].k = 0.01;
  bodyConstants[bodyConstants.length-2].vectors = false;
  bodyConstants[bodyConstants.length-2].nickname = "spring " + (getLabel(component));
  bodyConstants[bodyConstants.length-1].nickname = "spring " + (getLabel(component)) + " end";
  
  return [component, componentChild];
}

// Applies spring forces to the specified body and returns corresponding acceleration in [x,y]
function applySpringForces(body) {
    var a = [0,0];    

    if(bodyType(body) != "kinematics1D-mass" || body2Constant(body).mass == 0) return a;

    var springF = getSpringForce(body);
    a[0] = springF[0] / body2Constant(body).mass;
    a[1] = springF[1] / body2Constant(body).mass;

    return a;
}

function getSpringForce(body)
{
  var constants = body2Constant(body);
  
  var springFx = 0;
  var springFy = 0;
  
  for(var i=0; i < constants.attachedTo.length; i++){
    // Get the 'i'th spring child this body is attached to
    var attached = Globals.world.getBodies()[constants.attachedTo[i]];
    
    // The parent element represents the equilibrium point
    if(body2Constant(attached).ctype == "kinematics1D-spring-child"){
      var spring_idx = Globals.bodyConstants[constants.attachedTo[i]].parent;      
      var spring = Globals.world.getBodies()[spring_idx];
      
      // Recall: F=m*a -> a = F/m and F =-k*x so a = -k*x/m      
      var factor = getScaleFactor();
      var origin = {x:Globals.variableMap[getKF()][spring_idx].posx ,y:Globals.variableMap[getKF()][spring_idx].posy};
      var attached = {x:attached.state.pos.x*factor, y:swapYpos(attached.state.pos.y, false)*factor};
      var k = body2Constant(spring).k;
      
      springFx += (-k * (attached.x - origin.x));
      springFy -= (-k * (attached.y - origin.y));            
    }
  }
  
  return [springFx, springFy];  
}

// Removes relationship between body and spring it is currently assigned to if it is delta units away.
function detachSpring(body){
  
  var world = Globals.world;
  var delta = Globals.delta;
  
  var remove = [];
  
  if(bodyType(body) == "kinematics1D-mass"){
    var targets = body2Constant(body).attachedTo;
    for(var j=0; j < targets.length; j++){
      var target = world.getBodies()[targets[j]];
      
      if(bodyType(target) == "kinematics1D-pulley") continue;
    
      if(distance(body.state.pos.x, body.state.pos.y, target.state.pos.x, target.state.pos.y) > delta){
        remove.push(j);
        delete body2Constant(target).attachedBody;
      }
    }
  
    var counter = 0;
    for(var j=0; j<remove.length; j++)
    {
        var target = remove[j];
        targets.splice(target-counter, 1);
        counter++;
    }
  }
  
  if(bodyType(body) == "kinematics1D-sprint-child"){
    var target = body2Constant(body).attachedBody;
    delete body2Constant(body).attachedBody;
    body2Constant(Globals.world.getBodies()[target]).attachedTo.splice(bIndex(body), 1);
  }
  
}

// Adds relationship between body and spring if it is within delta units to the stretched point
function attachSpring(body){  
  
  var constants = body2Constant(body);
  
  if(constants.ctype != "kinematics1D-mass" && constants.ctype != "kinematics1D-spring-child")
    return;
  
  var isMass = constants.ctype == "kinematics1D-mass";
  var world = Globals.world;
  var bodies = world.getBodies();  
  var i = world.getBodies().indexOf(body);
  var delta = Globals.delta;
  
  for(var j=1; j<bodies.length; j++){
    
    // Attempt to form attachment to specified body
    var target = bodies[j];
    var t_constants = body2Constant(target);
    
    // The body is only a candidate if within delta pixels
    if(distance(body.state.pos.x, body.state.pos.y, target.state.pos.x, target.state.pos.y) > delta)
      continue;
    
    // If the original body is a mass, ensure that we are attempting to attach to a free spring child
    if(isMass && t_constants.ctype == "kinematics1D-spring-child")
    {
      if(!t_constants.attachedBody)
      {
        t_constants.attachedBody = i;
        constants.attachedTo.push(j);        
      }
    }    
    // If the original body is a spring-child, allow it to attach to any mass
    else if(!isMass && t_constants.ctype == "kinematics1D-mass")
    {      
      body2Constant(body).attachedBody = bIndex(target);
      body2Constant(target).attachedTo.push(bIndex(body));
    }
  }
  
  // If the original body is a mass, snap to the first body it attached to and snap all others to the same spot
  if(isMass && constants.attachedTo.length > 0){
    onPropertyChanged(i, "posx", Globals.variableMap[getKF()][constants.attachedTo[0]]["posx"], false);
    onPropertyChanged(i, "posy", Globals.variableMap[getKF()][constants.attachedTo[0]]["posy"], false);
    for(var j=1; j < constants.attachedTo.length; j++){
      onPropertyChanged(constants.attachedTo[j], "posx", Globals.variableMap[getKF()][i]["posx"], false);
      onPropertyChanged(constants.attachedTo[j], "posy", Globals.variableMap[getKF()][i]["posy"], false);  
    }
  }
  
  // If the original body is a spring, snap it to the mass is attached to
  if(!isMass && constants.attachedBody){
    onPropertyChanged(i, "posx", Globals.variableMap[getKF()][constants.attachedBody]["posx"], false);
    onPropertyChanged(i, "posy", Globals.variableMap[getKF()][constants.attachedBody]["posy"], false);
  }
}
