/*
  mass.js --
  This file defines functions related to 'mass' physics components
*/

// Add a mass component to current world using the specified coordinates
function addMass(data){
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  // Default image: use Principia logo. Can be changed from select element.
  var img = document.createElement("img");
  img.setAttribute("src", "/static/img/logo/logo.png");
  img.setAttribute("width", "50");
  img.setAttribute("height", "50");
  
  // Add the PhysicsJS body
  var component = Physics.body('circle', {
            x: data.x,
            y: data.y,
            radius: 25,
            view: img,
            styles: {
              fillStyle: '#716cc4',
              angleIndicator: '#3b3e6b'
            }
          });
          
  // Upon being added, a map of variables associated with this mass is added to the globals
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
                  
  // Assign constants
  bodyConstants[bodyConstants.length-1].mass = 1.0;
  bodyConstants[bodyConstants.length-1].size = 100;
  bodyConstants[bodyConstants.length-1].img  = 0;  
  bodyConstants[bodyConstants.length-1].vectors = true;
  
  // Add the component to the world and update all keyframes
  world.add(component);    
  updateKeyframes([component]);
  
  return component;
}