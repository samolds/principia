/*
  utility.js -- 
  This file contains utility functions for mathematics and physics operations
*/

// Gets the Euclidean distance between the specified points
function distance(x1,y1, x2,y2){
  var dx = x2-x1;
  var dy = y2-y1;
  with(Math){ return sqrt(pow(dx,2)+pow(dy,2)); }
}

// Returns a state of zero values
function defaultState(){
  var dstate = { 
    pos: new Physics.vector(),
    vel: new Physics.vector(),
    acc: new Physics.vector(),
    angular: { pos: 0.0, vel: 0.0, acc: 0.0}
  };
  return dstate;
}

// Returns a clone of the provided state's elements
function cloneState(state){
  var acc = state.acc.clone(); var vel = state.vel.clone(); var pos = state.pos.clone();
  var ang = {"acc": state.angular.acc, "vel": state.angular.vel, "pos": state.angular.pos};
  return {"acc": acc, "vel": vel, "pos": pos, "angular": ang};
}

//Returns the index of the specified body within the world
function bIndex(body){ return Globals.world.getBodies().indexOf(body); }

// Returns and array of all body indices where showGraph === true
function graphBodyIndices(){
  result = [];

  for (var index = 0, len = Globals.bodyConstants.length; index < len; index++) {
    bodyConstant = Globals.bodyConstants[index];
    if(bodyConstant.showGraph) {
      result.push(index);
    }
  }

  return result;
}

//Returns the index of the specified frame as a keyframe
function kIndex(frame) { return Globals.keyframes.indexOf(frame); }

// Returns the constants associated with the specified body
function body2Constant(body){ return Globals.bodyConstants[bIndex(body)]; }

// Transforms from user-defined coordinate system to default PhysicsJS coordinate system
function origin2Physics(point){
  return [point[0] + Globals.origin[0], point[1] + Globals.origin[1]];
}

// Transforms from user-defined coordinate system to default PhysicsJS coordinate system
function origin2PhysicsScalar(coordinate, value){
  var value = parseFloat(value);
  return coordinate == "x"? value + Globals.origin[0]: value + Globals.origin[1];
}

// Transforms from default PhysicsJS coordinate system to user-defined coordinate system
function physics2Origin(point){
  return [point[0] - Globals.origin[0], point[1] - Globals.origin[1]];
}

// Transforms from Cartesian to Polar (assumes point is in user-defined coordinate system)
function cartesian2Polar(point){
  var x = point[0];
  var y = point[1];
  var theta = rad2deg(Math.atan(y/x));
  
  // Q1: Use theta
  // Q2, Q3: Use theta + 180
  // Q4: Use theta + 360
  if(x < 0) theta += 180; // Handles Q2, Q3
  if(x > 0 && y < 0) theta += 360; // Handles Q4 
  
  if(x == 0)
  {
    if(y > 0) theta = 90;
    else if(y < 0) theta = 270;
    else theta = 0;
  }
    
  return [magnitude(x,y), theta];
}

function polar2Cartesian(point){
  // Note that testing shows that there is potentially ~1e-7 rounding error
  return [point[0] * Math.cos(deg2rad(point[1])), point[0] * Math.sin(deg2rad(point[1]))];
}

function rad2deg(rads) { return 57.2957795131 * rads; }

function deg2rad(degs) { return 0.01745329251 * degs; }

function convertUnit(value, type, invert){
  
  if(value == "" || isNaN(value)) 
    return value;
  
  // No conversion for degrees
  if(type.slice(-1) == "y" && Globals.coordinateSystem == "polar")
    return value;
  
  var l = Globals.lengthFactor;
  var t = Globals.timeFactor;
  
  if(type == "posx" || type == "posy")
    return invert? value * (1.0/l) : value * l;
  else if(type== "velx" || type == "vely")
    return invert? value * (1.0/l)*t : value * l * (1.0/t);
  else if(type== "accx" || type == "accy")
    return invert? value * (1.0/l)*t*t : value * Globals.lengthFactor * (1.0/(t*t));
  else
    return value;
}

function getLabel(body){

  switch(bodyType(body)){
    case 'kinematics1D-mass':    return Globals.massBodyCounter;
    case 'kinematics1D-pulley':  return Globals.pulleyBodyCounter;
    case 'kinematics1D-surface': return Globals.surfaceBodyCounter;
    case 'kinematics1D-ramp':    return Globals.rampBodyCounter;
    case 'kinematics1D-spring':  return Globals.springBodyCounter;
  }
  return 0;
}

function bodyType(body) { return body2Constant(body).ctype; }

function lastKF(){
  for(var frame = Globals.frame; frame >= 0; frame--){
    var keyframe = ($.inArray(frame, Globals.keyframes) != -1)? kIndex(frame): false;
    
    if(keyframe !== false)
      return keyframe;
  }
}

function magnitude(x, y){ return Math.sqrt(x*x + y*y); }

function clamp(min, x, max) { return Math.min(Math.max(x, min), max); }

function getOldValue(body, property){
  var keyframe = getKF();  
  var state = Globals.keyframeStates[keyframe][bIndex(body)];
  var constants = body2Constant(body);
  
  if(typeof constants[property] !== 'undefined')
    return constants[property];
  
  switch(property){
    case "posx": return state.pos.x;
    case "posy": return state.pos.y;
    case "velx": return state.vel.x;
    case "vely": return state.vel.y;
    case "accx": return state.acc.x;
    case "accy": return state.acc.y;
  }
  
  return 0;
}

function swapYpos(value, invert){
  var height = $("#" + Globals.canvasId).children()[0].height;
  return invert? value - height: height - value;
}

// Returns either the current keyframe if it is set, or the immediately previous keyframe if it is not
function getKF() { return (Globals.keyframe !== false)? Globals.keyframe: lastKF(); }

function getScaleFactor() { return Math.pow(2, Globals.scale * -1); }

/*  Uses given data (assumed pixel coordinates) to return result contain PhysicsJS canonical coordinates */
function canonicalTransform(data) { 
  var result = {};
  result.x = data.x * getScaleFactor() - Globals.translation.x * getScaleFactor();
  result.y = swapYpos(data.y, false) * getScaleFactor() + Globals.translation.y * getScaleFactor();
  return result;
}

/* Returns a value obtained by transforming PhysicsJS canonical coordinate to pixel coordinate (target) */
function pixelTransform(canon, coordinate, doTranslation){
  
  var scale = getScaleFactor();
  var translate = doTranslation? {x:Globals.translation.x, y:Globals.translation.y}: {x:0, y:0};
  return (coordinate == "x")? canon/scale - translate.x: swapYpos(canon/scale, false) - translate.y;
}

/* Returns the pixel coordinate of the specified body (current position) */
function pixelCoordinate(body){
  var result = {};
  result.x = body.state.pos.x + Globals.translation.x;
  result.y = body.state.pos.y - Globals.translation.y;
  return result;
}
