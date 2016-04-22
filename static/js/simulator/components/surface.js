/*
  surface.js --
  This file defines functions related to 'surface' physics components
*/

/*
  Add a surface component to current world using the specified canonical coordinates in the data object
  This function sets up associated constants and variables and returns the PhysicsJS component that was added
*/
function addSurface(data){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  // Add the PhysicsJS body
  var component = Physics.body('rectangle', {
    restitution: 0.0,
    treatment: 'static',
    x: pixelTransform(data.x, "x"),
    y: pixelTransform(data.y, "y"),
    width: 100.0/getScaleFactor(),
    height: 7.0/getScaleFactor(),
    cof: 0.0,
    styles: {
      fillStyle: '#4d4d4d',
    },
  });
          
  // Upon being added, a map of variables associated with this surface is added to the globals
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
  Globals.surfaceBodyCounter++;

  // Assign constants
  bodyConstants[bodyConstants.length-1].surfaceWidth = 100.0;
  bodyConstants[bodyConstants.length-1].surfaceHeight = 7.0;
  bodyConstants[bodyConstants.length-1].surfaceFriction = 0.0;
  bodyConstants[bodyConstants.length-1].nickname = "surface " + getLabel(component);

  return component;
}

/*
  Updates a surface-specific property with the specified value
*/
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

/*
  Modifies the width of the specified surface (within reasonable limits)
*/
function setSurfaceWidth(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 100000 || value == 0.0 || isNaN(value))
    return;
  value = Math.abs(value);
  
  body.width = value / getScaleFactor();
  body.geometry.width = value / getScaleFactor();
  body.view = null;

  Globals.bodyConstants[bIndex(body)]["surfaceWidth"] = value.toFixed(Globals.dPrecision);
}

/*
  Modifies the height of the specified surface (within reasonable limits)
*/
function setSurfaceHeight(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 100000 || value == 0.0 || isNaN(value))
    return;
  value = Math.abs(value);
  
  body.height = value / getScaleFactor();
  body.geometry.height = value / getScaleFactor();
  body.view = null;

  Globals.bodyConstants[bIndex(body)]["surfaceHeight"] = value.toFixed(Globals.dPrecision);
}

/*
  Modifies the friction of the specified surface (within reasonable limits)
*/
function setSurfaceFriction(body, value) {
  value = parseFloat(value);
  if (Math.abs(value) > 1.0 || value < 0.0 || isNaN(value))
    return;

  body.cof = value;
  
  Globals.bodyConstants[bIndex(body)]["surfaceFriction"] = value.toFixed(Globals.dPrecision);
}
