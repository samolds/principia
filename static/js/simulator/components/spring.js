function addSpring(data)
{
  var world = Globals.world;
  var variableMap = Globals.variableMap;
  var bodyConstants = Globals.bodyConstants;
  
  var component = Physics.body('circle', {
              treatment:"ghost",
              x: data.x,
              y: data.y,           
              radius: 6,
              styles: {
                fillStyle: '#6c71c4',
                angleIndicator: '#3b3e6b'
              }
            });
            
  var componentChild = Physics.body('circle', {              
              treatment:"ghost",
              x: data.x+120,
              y: data.y,             
              radius: 6,                    
              styles: {
                fillStyle: '#6c71c4',
                angleIndicator: '#3b3e6b'
              }
            });
            
  variableMap.push({k:0.01});           // Variables associated with spring constants    
  variableMap.push({x0:data.x+120, xf: data.x+120});  // Variables associated with stretched point.
  
  world.add(component);
  world.add(componentChild);
  
  bodyConstants[bodyConstants.length-2].child = world.getBodies().indexOf(componentChild);
  bodyConstants[bodyConstants.length-1].parent = world.getBodies().indexOf(component);
          
  // Spring constant
  bodyConstants[bodyConstants.length-2].k = 0.01;
  
  updateKeyframes([component, componentChild]);
  
  return [component, componentChild];
}

function applySpringForces(body) {
    var a = [0,0];    
    var constants = body2Constant(body)
    
    if(constants.attachedTo){
      var attached = Globals.world.getBodies()[constants.attachedTo];
      var spring_idx = Globals.bodyConstants[constants.attachedTo].parent;
      var spring = Globals.world.getBodies()[spring_idx]; // The parent element represents the equilibrium point
      var properties = body2Constant(spring);
      
      
      var origin = [spring.state.pos.x, spring.state.pos.y];     
      var springFx = -properties.k * (attached.state.pos.x - origin[0]);
      var springFy = -properties.k * (attached.state.pos.y - origin[1]);
      a[0] = springFx / body2Constant(body).mass;
      a[1] = springFy / body2Constant(body).mass;
    }
    
  return a;
}

function detachSpring(body){
  var world = Globals.world;
  var delta = 50;
  
  if(body2Constant(body).attachedTo || body2Constant(body).attachedTo === 0)
  {
    var attachedTo = world.getBodies()[body2Constant(body).attachedTo];
    if(distance(body.state.pos.x, body.state.pos.y, attachedTo.state.pos.x, attachedTo.state.pos.y) > delta) {
        console.log("detached");
        delete body2Constant(attachedTo).attachedBody;
        delete body2Constant(body).attachedTo;
    }
  }
}

function attachSpring(body){  
  var world = Globals.world;
  var bodies = world.getBodies();
  var kState = Globals.keyframeStates[Globals.keyframe];
  var i = world.getBodies().indexOf(body);
  var delta = 50;
  
  for(var j=0; j<bodies.length; j++){
    var attachBody = bodies[j];
    
    // Prevent multiple bodies from attaching to the same spring
    if(body2Constant(attachBody).attachedBody) continue;
    
    if(distance(body.state.pos.x, body.state.pos.y, attachBody.state.pos.x, attachBody.state.pos.y) <= delta){
      if(body2Constant(body).ctype == "kinematics1D-mass" && body2Constant(attachBody).ctype == "kinematics1D-spring-child"){
        console.log("attached"); 
        console.log(distance(body.state.pos.x, body.state.pos.y, attachBody.state.pos.x, attachBody.state.pos.y));
        body2Constant(attachBody).attachedBody = bodies.indexOf(body);
        body2Constant(body).attachedTo = bodies.indexOf(attachBody);
        
        kState[i].pos.x = attachBody.state.pos.x;
        kState[i].pos.y = attachBody.state.pos.y;
        body.state.pos.x = attachBody.state.pos.x;
        body.state.pos.y = attachBody.state.pos.y;             
             
        // Attempt to update the corresponding variable
        if(Globals.useKeyframes) updateVariable(body, "posx", attachBody.state.pos.x);
        if(Globals.useKeyframes) updateVariable(body, "posy", attachBody.state.pos.y);        
      }
    }
  }
}