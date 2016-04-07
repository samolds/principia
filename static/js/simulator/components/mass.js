/*
  mass.js --
  This file defines functions related to 'mass' physics components
*/

// Add a mass component to current world using the specified coordinates
function addMass(data){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  // Default image: use pointmass image. Can be changed from select element.
  var img = document.createElement("img");
  img.setAttribute("src", "/static/img/toolbox/mass.png");
  
  var size = 50/getScaleFactor();
  img.setAttribute("width", "" + size);
  img.setAttribute("height", "" + size);
  
  // Add the PhysicsJS body
  var component = Physics.body('circle', {
            x: pixelTransform(data.x, "x"),
            y: pixelTransform(data.y, "y"),
            restitution: 0.8,
            radius: size/2,
            view: img,
            styles: {
              fillStyle: '#4d4d4d',
              angleIndicator: '#ffffff'
            }
          });
          
  // Upon being added, a map of variables associated with this mass is added to the globals
  if(!Globals.loading){
    addToVariableMap(
      {
        posx: data.x, 
        posy: data.y,
        velx: 0,
        vely: 0,
        accx: 0,
        accy: 0
      }
    );
  }

  // Add the component to the world and update all keyframes
  world.add(component);
  updateKeyframes([component]);
  Globals.massBodyCounter++;
                  
  // Assign constants
  bodyConstants[bodyConstants.length-1].mass = 1.0;
  bodyConstants[bodyConstants.length-1].size = size/2;
  bodyConstants[bodyConstants.length-1].img  = 0;  
  bodyConstants[bodyConstants.length-1].vectors = true;
  bodyConstants[bodyConstants.length-1].vectors_ttt = false;
  bodyConstants[bodyConstants.length-1].showGraph = false;
  bodyConstants[bodyConstants.length-1].nickname = "mass " + (getLabel(component));
  
  return component;
}
