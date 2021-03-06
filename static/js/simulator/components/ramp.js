/*
  ramp.js --
  This file defines functions related to 'ramp' physics components
*/

/*
  Add a ramp component to current world using the specified canonical coordinates in the data object
  This function sets up associated constants and variables and returns the PhysicsJS component that was added
*/
function addRamp(data){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  // Default width and height (the latter inverted to create a ramp with NE facing slope)
  var width = 100;
  var height = -60;
  
  // Add the PhysicsJS body
  var component = Physics.body('convex-polygon', {
    restitution: 0.0,
    treatment: 'static',
    x: pixelTransform(data.x, "x"),
    y: pixelTransform(data.y, "y"),
    cof: 0.0,
    styles: {
      fillStyle: '#4d4d4d',
    },
    vertices: [
      { x: 0, y: 0 },
      { x: width/getScaleFactor(), y: 0 },
      { x: 0, y: height/getScaleFactor() }
    ]
  });
          
  // Upon being added, a map of variables associated with this ramp is added to the globals
  if(!Globals.loading){
    addToVariableMap({
        posx: data.x, 
        posy: data.y,
      }
    );
  }

  // Add the component to the world and update all keyframes
  world.add(component);
  updateKeyframes([component]);
  Globals.rampBodyCounter++;
                  
  // Assign constants
  bodyConstants[bodyConstants.length-1].rampWidth = width;
  bodyConstants[bodyConstants.length-1].rampHeight = height;
  bodyConstants[bodyConstants.length-1].rampAngle = -30.964;
  bodyConstants[bodyConstants.length-1].rampFriction = 0.0;
  bodyConstants[bodyConstants.length-1].nickname = "ramp " + getLabel(component);
  
  return component;
}

/*
  Updates a ramp specific property to have the specified value
*/
function updateRamp(body, property, value){
  if(bodyType(body) !== "kinematics1D-ramp") return;
  switch(property)
  {
    case "rampWidth":    setRampWidth(body, value, false); break;
    case "rampHeight":   setRampHeight(body, value, false); break;
    case "rampAngle":    setRampAngle(body, value); break;
    case "rampFriction": setRampFriction(body, value); break;
  }
}

/*
  Updates the width of a ramp, inverting it if negatives are allowed and the value is < 0
  The height is fixed, the angle will be modified to compensate
*/
function setRampWidth(body, value, allow_negatives){
  value = parseFloat(value);
  if (Math.abs(value) > 100000 || value == 0.0 || isNaN(value))
    return;
  
  if(!allow_negatives)
  {
    if(value < 0) return;
    value = value * Math.sign(body2Constant(body).rampWidth);
  }

  // Get the actual height
  var height = Globals.bodyConstants[bIndex(body)]["rampHeight"];

  // Determine and assign new vertices
  var newVertices = [
            {x: 0, y: 0},
            {x: value / getScaleFactor(), y: 0},
            {x: 0, y: height / getScaleFactor()}];
  body.vertices = newVertices;
  body.geometry.setVertices(newVertices);
  body.view = null;

  // Assign a new angle and save the modified width and angle
  var newAngle = Math.atan(height / value) * (180.0 / Math.PI);
  Globals.bodyConstants[bIndex(body)]["rampWidth"] = value.toFixed(Globals.dPrecision);
  Globals.bodyConstants[bIndex(body)]["rampAngle"] = newAngle.toFixed(Globals.dPrecision);
}

/*
  Updates the height of a ramp, inverting it if negatives are allowed and the value is < 0
  The width is fixed, the angle will be modified to compensate
*/
function setRampHeight(body, value, allow_negatives){
  value = parseFloat(value);
  if (Math.abs(value) > 100000 || value == 0.0 || isNaN(value))
    return;
  
  if(!allow_negatives)
  {
    if(value < 0) return;
    value = value * Math.sign(body2Constant(body).rampHeight);
  }
  
  // Get the actual width
  var width = Globals.bodyConstants[bIndex(body)]["rampWidth"];

  // Compute and assign new vertices
  var newVertices = [
            {x: 0, y: 0},
            {x: width / getScaleFactor(), y: 0},
            {x: 0, y: value / getScaleFactor()}];
  body.vertices = newVertices;
  body.geometry.setVertices(newVertices);
  body.view = null;

  // Compute a new angle, store the new height and angle
  var newAngle = Math.atan(value / width) * (180.0 / Math.PI);
  Globals.bodyConstants[bIndex(body)]["rampHeight"] = value.toFixed(Globals.dPrecision);
  Globals.bodyConstants[bIndex(body)]["rampAngle"] = newAngle.toFixed(Globals.dPrecision);
}

/*
  Updates the angle of a ramp
  The width is fixed, the height will be modified to compensate
*/
function setRampAngle(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 360.0 || value == 0.0 || isNaN(value))
    return;

  if(value < 0) return;
  if(body2Constant(body).rampWidth > 0)
    value = value * Math.sign(body2Constant(body).rampAngle);
  
  if(body2Constant(body).rampWidth < 0 && body2Constant(body).rampHeight < 0)
    value = Math.abs(value);

  // Get all of the other vertices except for the "height" vertex
  var newVertices = body.vertices.filter(function(vert) { return vert.y === 0; });
  var width = body.vertices.filter(function(vert) { return vert.x !== 0; })[0].x;

  // Calculate the new height of the triangle using the width and the angle
  var newHeight = Math.tan(value * (Math.PI / 180.0)) * Math.abs(width);
  if(newHeight > 0 && body2Constant(body).rampHeight < 0) newHeight *= -1;
  
  newVertices.push({x: 0, y: newHeight}); // Add the new vertex for the height
  body.vertices = newVertices;
  body.geometry.setVertices(newVertices);
  body.view = null;

  // Store the new values
  Globals.bodyConstants[bIndex(body)]["rampAngle"] = value.toFixed(Globals.dPrecision);
  Globals.bodyConstants[bIndex(body)]["rampHeight"] = newHeight.toFixed(Globals.dPrecision);
}

/*
  Sets the friction coefficient of the specified ramp body
*/
function setRampFriction(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 1.0 || value < 0.0 || isNaN(value))
    return;

  body.cof = value;

  Globals.bodyConstants[bIndex(body)]["rampFriction"] = value.toFixed(Globals.dPrecision);
}
