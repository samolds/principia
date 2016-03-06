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
  img.setAttribute("width", "50");
  img.setAttribute("height", "50");
  
  // Add the PhysicsJS body
  var component = Physics.body('circle', {
            x: data.x,
            y: data.y,
            restitution: 0.8,
            radius: 25,
            view: img,
            styles: {
              fillStyle: '#4d4d4d',
              angleIndicator: '#ffffff'
            }
          });
          
  // Upon being added, a map of variables associated with this mass is added to the globals
  addToVariableMap(
    {
      posx: data.x, 
      posy: swapYpos(data.y, false),
      velx: 0,
      vely: 0,
      accx: 0,
      accy: 0
    }
  );
                  
  // Assign constants
  bodyConstants[bodyConstants.length-1].mass = 1.0;
  bodyConstants[bodyConstants.length-1].size = 25;
  bodyConstants[bodyConstants.length-1].img  = 0;  
  bodyConstants[bodyConstants.length-1].vectors = true;
  bodyConstants[bodyConstants.length-1].vectors_ttt = false;
  bodyConstants[bodyConstants.length-1].showGraph = false;
  bodyConstants[bodyConstants.length-1].nickname = "mass " + (getLabel(component));
  
  // Add the component to the world and update all keyframes
  world.add(component);    
  updateKeyframes([component]);
  
  return component;
}
