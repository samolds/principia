function addMass(data)
{
  var world = Globals.world;
  var bodyConstants = Globals.bodyConstants;
  var variableMap = Globals.variableMap;
  
  var img = document.createElement("img");
  img.setAttribute("src", "/static/img/logo/logo.png");
  img.setAttribute("width", "50");
  img.setAttribute("height", "50");
  
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
  variableMap.push({x0:data.x, xf: data.x, v0:0, vf:0, a:0, m:1});
  
  bodyConstants[bodyConstants.length-1].mass = 1.0;
  bodyConstants[bodyConstants.length-1].size = 100;
  bodyConstants[bodyConstants.length-1].img  = 0;  
  
  world.add(component);  
  
  updateKeyframes([component]);
  
  return component;
}