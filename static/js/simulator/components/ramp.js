/*
  ramp.js --
  This file defines functions related to 'ramp' physics components
*/

// Add a ramp component to current world using the specified coordinates
function addRamp(data){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  // Add the PhysicsJS body
  var component = Physics.body('convex-polygon', {
            restitution: 0.0,
            treatment: 'static',
            x: data.x,
            y: data.y,
            styles: {
              fillStyle: '#4d4d4d',
            },
            vertices: [
              { x: 0, y: 0 },
              { x: 100.0, y: 0 },
              { x: 0, y: -60.0 }
            ]
          });
          
  // Upon being added, a map of variables associated with this ramp is added to the globals
  addToVariableMap({
      posx: data.x, 
      posy: data.y,
      width: 100.0,
      height: -60.0,
      angle: -30.964,
    }
  );

  // Add the component to the world and update all keyframes
  world.add(component);
  updateKeyframes([component]);
  Globals.rampBodyCounter++;
                  
  // Assign constants
  bodyConstants[bodyConstants.length-1].width = 100.0;
  bodyConstants[bodyConstants.length-1].height = -60.0;
  bodyConstants[bodyConstants.length-1].angle = -30.964;
  bodyConstants[bodyConstants.length-1].orientation = "right";
  bodyConstants[bodyConstants.length-1].nickname = "ramp " + getLabel(component);
  
  return component;
}

function updateRamp(body, property, value)
{
  if(bodyType(body) !== "kinematics1D-ramp") return;
  switch(property)
  {
    case "width":       setRampWidth(body, value); break;
    case "height":      setRampHeight(body, value); break;
    case "angle":       setRampAngle(body, value); break;
    case "orientation": setRampOrientation(body, value); break;
  }
}

function setRampWidth(body, value){
    if (Math.abs(value) > 500.0)
      return;

    // Get all of the other vertices except for the "width" vertex    
    var newVertices = body.vertices.filter(function(vert) { return vert.x === 0; });
    var height = body.vertices.filter(function(vert) { return vert.y !== 0; })[0].y;

    newVertices.push({x: value, y: 0}); // Add the new vertex for the width
    body.vertices = newVertices;
    body.geometry.setVertices(newVertices);
    body.view = null;

    var newAngle = Math.atan(height / value) * (180.0 / Math.PI);
    Globals.bodyConstants[bIndex(body)]["width"] = value.toFixed(Globals.dPrecision);
    Globals.bodyConstants[bIndex(body)]["angle"] = newAngle.toFixed(Globals.dPrecision);
}

function setRampHeight(body, value){
  if (value <= -500.0 || value > 500.0)
    return;
  
  // Get all of the other vertices except for the "height" vertex
  var newVertices = body.vertices.filter(function(vert) { return vert.y === 0; });
  var width = body.vertices.filter(function(vert) { return vert.x !== 0; })[0].x;

  newVertices.push({x: 0, y: value}); // Add the new vertex for the height
  body.vertices = newVertices;
  body.geometry.setVertices(newVertices);
  body.view = null;

  var newAngle = Math.atan(value / width) * (180.0 / Math.PI);
  Globals.bodyConstants[bIndex(body)]["height"] = value.toFixed(Globals.dPrecision);
  Globals.bodyConstants[bIndex(body)]["angle"] = newAngle.toFixed(Globals.dPrecision);
}

function setRampAngle(body, value){
  if (value < -89.0 || value > 89.0 || value == 0.0)
    return;

  // Get all of the other vertices except for the "height" vertex
  var newVertices = body.vertices.filter(function(vert) { return vert.y === 0; });
  var width = body.vertices.filter(function(vert) { return vert.x !== 0; })[0].x;

  // Calculate the new height of the triangle using the width and the angle
  var newHeight = Math.tan(value * (Math.PI / 180.0)) * Math.abs(width);

  newVertices.push({x: 0, y: newHeight}); // Add the new vertex for the height
  body.vertices = newVertices;
  body.geometry.setVertices(newVertices);
  body.view = null;

  Globals.bodyConstants[bIndex(body)]["angle"] = value.toFixed(Globals.dPrecision);
  Globals.bodyConstants[bIndex(body)]["height"] = newHeight.toFixed(Globals.dPrecision);
}

function setRampOrientation(body, value){
  
}