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

  Globals.bodyConstants.forEach(function(body, i) {
      if(body.showGraph) {
        result.push(i);
      }
  });

  return result;
}

//Returns the index of the specified frame as a keyframe
function kIndex(frame) { return Globals.keyframes.indexOf(frame); }

// Returns the constants associated with the specified body
function body2Constant(body){
  var index = bIndex(body);
  return Globals.bodyConstants[index];
}

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
  if(x < 0) theta -= 180; // Handles Q2, Q3
  if(x > 0 && y > 0) theta -= 360; // Handles Q4 
  
  if(x == 0)
  {
    if(y > 0) theta = -270;
    else if(y < 0) theta = -90;
    else theta = 0;
  }
  
  // Negate theta due to inverted y-axis
  return [Math.sqrt(x*x + y*y), -theta];
}

function polar2Cartesian(point){
  // Negate sin due to inverted y-axis: Also note that testing shows that there is potentially ~1e-7 rounding error
  return [point[0] * Math.cos(deg2rad(point[1])), point[0] * -Math.sin(deg2rad(point[1]))];
}

function rad2deg(rads) { return 57.2957795131 * rads; }

function deg2rad(degs) { return 0.01745329251 * degs; }

function convertUnit(value, type, invert){
  
  if(value == "" || isNaN(value)) 
    return value;
  
  // No conversion for degrees
  if(type.slice(-1) == "y" && Globals.coordinateSystem == "polar")
    return value;
  
  if(type == "posx" || type == "posy")
    return invert? value * 1.0/Globals.lengthFactor :
                   value * Globals.lengthFactor;
  else
    return invert? value * 1.0/Globals.lengthFactor * Globals.timeFactor :
                   value * Globals.lengthFactor * 1.0/Globals.timeFactor;
}

function getLabel(body)
{
  return 1;
}

function lastKF()
{
  for(var frame = Globals.frame; frame >= 0; frame--)
  {
    var keyframe = ($.inArray(frame, Globals.keyframes) != -1)? kIndex(frame): false;
    
    if(keyframe !== false)
      return keyframe;
  }
}