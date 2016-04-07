/*
  surface.js --
  This file defines functions related to 'surface' physics components
*/

// Add a surface component to current world using the specified coordinates
function addSurface(data){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  // Add the PhysicsJS body
  var component = Physics.body('rectangle', {
            restitution: 0.0,
            treatment: 'static',
            x: data.x,
            y: data.y,
            width: 100.0,
            height: 7.0,
            cof: 0.0,
            styles: {
              fillStyle: '#4d4d4d',
            },
          });
          
  // Upon being added, a map of variables associated with this surface is added to the globals
  if(!Globals.loading){
    addToVariableMap({
        posx: data.x, 
        posy: swapYpos(data.y, false),
        surfaceWidth: 100.0,
        surfaceHeight: 7.0,
        surfaceFriction: 0.0,
      }
    );
  }

  // Add the component to the world and update all keyframes
  world.add(component);
  updateKeyframes([component]);
  Globals.surfaceBodyCounter++;

  // Assign constants
  bodyConstants[bodyConstants.length-1].surfaceWidth = 100.0;
  bodyConstants[bodyConstants.length-1].surfaceHeight = 7.0;
  bodyConstants[bodyConstants.length-1].surfaceFriction = 0.0;
  bodyConstants[bodyConstants.length-1].nickname = "surface " + getLabel(component);

  return component;
}

function updateSurface(body, property, value) {
  if (bodyType(body) !== "kinematics1D-surface")
    return;
  switch (property) {
    case "surfaceWidth":
      setSurfaceWidth(body, value);
      break;
    case "surfaceHeight":
      setSurfaceHeight(body, value);
      break;
    case "surfaceFriction":
      setSurfaceFriction(body, value);
      break;
  }
}

function setSurfaceWidth(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 500.0 || value == 0.0 || isNaN(value))
    return;
  value = Math.abs(value);
  
  body.width = value;
  body.geometry.width = value;
  body.view = null;

  Globals.bodyConstants[bIndex(body)]["surfaceWidth"] = value.toFixed(Globals.dPrecision);
}

function setSurfaceHeight(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 500.0 || value == 0.0 || isNaN(value))
    return;
  value = Math.abs(value);
  
  body.height = value;
  body.geometry.height = value;
  body.view = null;

  Globals.bodyConstants[bIndex(body)]["surfaceHeight"] = value.toFixed(Globals.dPrecision);
}

function setSurfaceFriction(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 1.0 || value < 0.0 || isNaN(value))
    return;

  body.cof = value;
  
  Globals.bodyConstants[bIndex(body)]["surfaceFriction"] = value.toFixed(Globals.dPrecision);
}
