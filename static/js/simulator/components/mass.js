/*
  mass.js --
  This file defines functions related to 'mass' physics components
*/

/*
  Add a mass component to current world using the specified canonical coordinates in the data object
  massType === "square" or "round": Determines how the mass will be rendered
  This function sets up associated constants and variables and returns the PhysicsJS component that was added
*/
function addMass(data, massType){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  var component = null;
  var imgIdx = null;
  
  // Default image: use pointmass image. Can be changed from select element.
  var img = document.createElement("img");
  var size = 50;
  var scaledSize = size / getScaleFactor();
  img.setAttribute("width", "" + scaledSize);
  img.setAttribute("height", "" + scaledSize);
  
  // Add the PhysicsJS body
  if (massType === "square") {
    img.setAttribute("src", "/static/img/toolbox/squaremass.png");
    imgIdx = 1;
    component = Physics.body('rectangle', {
          x: pixelTransform(data.x, "x"),
          y: pixelTransform(data.y, "y"),
          restitution: 0.5,
          width: scaledSize,
          height: scaledSize,
          view: img,
          cof: 1.0,
          styles: {
            fillStyle: '#4d4d4d',
            angleIndicator: '#ffffff'
          },
        });
  } else { // if (massType === "round") {
    img.setAttribute("src", "/static/img/toolbox/roundmass.png");
    imgIdx = 0;
    component = Physics.body('circle', {
          x: pixelTransform(data.x, "x"),
          y: pixelTransform(data.y, "y"),
          restitution: 0.5,
          radius: scaledSize / 2,
          view: img,
          cof: 1.0,
          styles: {
            fillStyle: '#4d4d4d',
            angleIndicator: '#ffffff'
          }
        });
  }

  // Upon being added, a map of variables associated with this mass is added to the globals
  if(!Globals.loading){
    addToVariableMap(
      {
        posx: data.x, 
        posy: data.y,
        velx: 0.0,
        vely: 0.0,
        accx: 0.0,
        accy: 0.0,
      }
    );
  }

  // Add the component to the world and update all keyframes
  world.add(component);
  bodyConstants[bodyConstants.length-1].attachedTo = []; // This constant is assigned first
  updateKeyframes([component]);
  Globals.massBodyCounter++;
                  
  // Assign constants:
  
  // Determines how this point mass is displayed:
  bodyConstants[bodyConstants.length-1].massType = massType;  
  bodyConstants[bodyConstants.length-1].size = size;
  bodyConstants[bodyConstants.length-1].img  = imgIdx;
  
  // Toggles for displaying (optionally tip-to-tail) vectors and a graph of this mass
  bodyConstants[bodyConstants.length-1].vectors = true;
  bodyConstants[bodyConstants.length-1].vectors_ttt = false;
  bodyConstants[bodyConstants.length-1].showGraph = false;
  
  // Default name and value for this mass
  bodyConstants[bodyConstants.length-1].nickname = "mass " + (getLabel(component));
  bodyConstants[bodyConstants.length-1].mass = 1.0;

  // Allow a mass to attach directly to a spring or pulley as it is placed
  attachSpring(component);
  attachPulley(component);
  
  return component;
}
