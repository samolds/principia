/*
  This file contains functions related to running (but not displaying) the underlying simulation.
*/
function attemptSimulation(){
	var world = Globals.world;
  var solver = Globals.solver;
	var keyframeStates = Globals.keyframeStates;

  if(world.getBodies().length < 1) return;
  
	// For 1-body:	
	var variables = Globals.variableMap[0];
	removals = [];
	for(var variable in variables){
		if(variables[variable] == "?")
			removals.push(variable);
	}
	
	// Remove unknowns from variable map
	for(var i=0; i<removals.length; i++){
		delete variables[removals[i]];
	}
	
	// Add time if known
	if(Globals.keyframeTimes[1]) // TODO: Generalize this
		variables["t"] = Globals.keyframeTimes[1];
	
	// Solve for unknowns, store results
	var results = solver.solve(variables);
  
  if(!results[0])
  {
    $("#solution-details")[0].textContent += "Error! There is insufficient data to solve for all unknowns.";
    Globals.timelineReady = false;
    return;
  }
  
	Globals.variableMap[0] = results[1];
	
	// TODO: Check if the results are sound and all variables are known
	// TODO: Update display of keyframe images to match results
	
	if(!Globals.keyframeTimes[1]){
		Globals.keyframeTimes[1] = results[1]["t"];
		Globals.totalFrames = results[1]["t"]/Globals.world.timestep();
	}
	$('#keyframe-1-dt').val(Globals.keyframeTimes[1]);
	$('#simulatorFrameRange')[0].max = Globals.totalFrames;
	
	// Modify bodies within keyframes to match results	
	keyframeStates[0][0]["pos"]["x"] = results[1]["x0"];
	keyframeStates[0][0]["vel"]["x"] = results[1]["v0"];
	keyframeStates[0][0]["acc"]["x"] = results[1]["a"];
	
	keyframeStates[1][0]["pos"]["x"] = results[1]["xf"];
	keyframeStates[1][0]["vel"]["x"] = results[1]["vf"];
	keyframeStates[1][0]["acc"]["x"] = results[1]["a"];

	// Draw keyframes in reverse order to update all the mini-canvases and so that we end up at t=0
	var nKF = Globals.keyframeStates.length;        
  for(var i=nKF-1; i >= 0; i--){          
    setStateKF(i);
    world.render();
    viewportToKeyCanvas(i);
  }
  
	// Run the simulation using the solved keyframes
	simulate();
	
	// If results are sound, the user can play the simulation
	Globals.keyframe = 0;
  Globals.timelineReady = true;
}

function simulate() {
  var i;
  var j;

  // Reset
  Globals.frame = 0;
  if (Globals.running) { toggleSimulator(); }
  $("#simulatorFrameRange").val(0);

  Globals.states = [];	// Clear states global
  Globals.world._time = 0;

  var old = defaultState();

  // Restore objects to their initial state
  var initStates = Globals.keyframeStates[0];
  for (i = 0; i < Globals.world.getBodies().length; i++) {
    Globals.world.getBodies()[i].state = cloneState(initStates[i]);
    Globals.world.getBodies()[i].state["old"] = cloneState(old);
    Globals.world.getBodies()[i]._started = undefined;
    Globals.states[i] = [];
  }
  
  // For each frame and then for each body in the simulation
  for (i = 0; i < Globals.totalFrames+1; i++){    
    for (j = 0; j < Globals.world.getBodies().length; j++){
      // Clone the state information for the current body
      var curState = Globals.world.getBodies()[j].state;
      var saveState = cloneState(curState);

      // Save state information and advance the simulator
      if (i != 0){ saveState["old"] = Globals.states[j][i-1]; }
      Globals.states[j].push(saveState);
    }
    Globals.world.step();
  }
}

function updateVariable(body, variable, value){
	var variableMap = Globals.variableMap;
	var i = Globals.world.getBodies().indexOf(body);
	
	if(isNaN(value)) value = "?";
  else value = parseFloat(value);
	if(Globals.keyframe == 0){
		if(variable == "posx") variableMap[i]["x0"] = value;
		if(variable == "velx") variableMap[i]["v0"] = value;
	}
	else {
		if(variable == "posx") variableMap[i]["xf"] = value;
		if(variable == "velx") variableMap[i]["vf"] = value;
	}
	
	if(variable == "accx") variableMap[i]["a"] = value;
}

// Set the state of the world to match keyframe n
function setStateKF(n){
  var bodies = Globals.world.getBodies();
  for (var i = 0; i < bodies.length; i++)
    bodies[i].state = Globals.keyframeStates[n][i]; 
}

// Set the state of the world to match simulation frame n
function setState(n){
  var bodies = Globals.world.getBodies();
  for (var i = 0; i < bodies.length; i++)
    bodies[i].state = Globals.states[i][n];
}

function onPropertyChanged(property, value, redraw){
	if(!Globals.canEdit()) return;
	//console.log(property + "," + value);
	
	var world = Globals.world;
  var bodies = world.getBodies();
	var body = Globals.selectedBody;	
  var i = world.getBodies().indexOf(body);
	var kState = Globals.keyframeStates[Globals.keyframe];
	
  // Parse the value, assigning NaN if the parse fails
  var valuef = parseFloat(value);
 
  // Attempt to update the corresponding variable
  if(Globals.useKeyframes) updateVariable(body, property, value);
 
  if (body) {
    switch(property)
    {		
      case 'posx':
        kState[i].pos.x = valuef;
        break;
      case 'posy':
        kState[i].pos.y = valuef;			
        break;
      case 'velx':
        kState[i].vel.x = valuef;
        break;
      case 'vely':
        kState[i].vel.y = valuef;
        break;
      case 'accx':
        kState[i].acc.x = valuef;
        break;
      case 'accy':
        kState[i].acc.y = valuef;
        break;
      case 'gravityx':
        Globals.gravity[0] = valuef;
        break;
      case 'gravityy':
        Globals.gravity[1] = valuef;
        break;
      case 'image':
        var img = document.createElement("img");
        img.setAttribute("width", "40");
        img.setAttribute("height", "40");
        img.setAttribute("src", value);
        body.view = img;
        body.view.onload = function() {
          drawMaster();
        }      
        return;      
      default:
        Globals.bodyConstants[i][property] = value;
        break;
    }
  }
  
  var delta = 100;
  // Wait until user does mouseup for snap-to effect
  if(!Globals.didMove && body) {
  for(var j=0; j<bodies.length; j++){
    var attachBody = bodies[j];
    if(distance(body.state.pos.x, body.state.pos.y, attachBody.state.pos.x, attachBody.state.pos.y) <= delta){
      if(body2Constant(body).ctype == "kinematics1D-mass" && body2Constant(attachBody).ctype == "kinematics1D-spring-child"){
        console.log("attached");
        body.treatment = "static";     
        body2Constant(attachBody).attachedBody = bodies.indexOf(body);
        body2Constant(body).attachedTo = bodies.indexOf(attachBody);
        
        kState[i].pos.x = attachBody.state.pos.x;
        kState[i].pos.y = attachBody.state.pos.y;
             
        // Attempt to update the corresponding variable
        if(Globals.useKeyframes) updateVariable(body, "posx", attachBody.state.pos.x);
        if(Globals.useKeyframes) updateVariable(body, "posy", attachBody.state.pos.y);        
      }
    }
  }
  
  // Handle detaching too!
  if(body2Constant(body).attachedTo || body2Constant(body).attachedTo === 0)
  {
    var attachedTo = world.getBodies()[body2Constant(body).attachedTo];
    if(distance(body.state.pos.x, body.state.pos.y, attachedTo.state.pos.x, attachedTo.state.pos.y) > delta) {
        console.log("detached");
     
        body.treatment = "dynamic";
        
        delete body2Constant(attachedTo).attachedBody;
        delete body2Constant(body).attachedTo;
    }
  }
  }
  
  // Rerun the simulation using updated properties if not using keyframes
  if(!Globals.useKeyframes && !Globals.didMove) simulate();
 
  // If told to redraw or if parameter is excluded, redraw
  if(redraw || redraw == undefined)
    drawMaster();
}

Physics.integrator('principia-integrator', function( parent ){
   
  function applyForces(body) {
    var a = 0;    
    var constants = body2Constant(body)
    if(constants.attachedTo)
    {
      var attached = Globals.world.getBodies()[constants.attachedTo];
      var spring_idx = Globals.bodyConstants[constants.attachedTo].parent;
      var spring = Globals.world.getBodies()[spring_idx]; //TODO FIX
      var properties = body2Constant(spring);
      var origin = spring.state.pos.x + properties.eq;     
      var springF = -properties.k * (attached.state.pos.x - origin)
      a = springF / body2Constant(body).mass;       
    }    
    return a;
  }
   
  return {  
  // Velocity increases by acceleration * dt
  integrateVelocities: function( bodies, dt ){
		
    // TODO: Apply forces to modify acceleration before integrating velocity
    
    
    for ( var i = 0, l = bodies.length; i < l; ++i ){
      var body = bodies[i];
      var state = body.state;	
      var spring_x = applyForces(body);    
      state.old = cloneState(body.state);
      
      state.vel.x += state.acc.x * dt + spring_x;
      state.vel.y += state.acc.y * dt;
      
      if(body.treatment == "dynamic"){
        state.vel.x += Globals.gravity[0];
        state.vel.y += Globals.gravity[1];
      }
      state.angular.vel += state.angular.acc;
		}
  },

	// Position increases by velocity * dt + 1/2 acceleration * dt**2
  integratePositions: function( bodies, dt ){
    for ( var i = 0, l = bodies.length; i < l; ++i ){
      var body = bodies[ i ];
      var state = body.state;
      var temp = cloneState(body.state);
      
      if(body.treatment == "static") {        
        state.pos.x += state.vel.x;// * dt; //+ state.acc.x * 0.5 * dt*dt;
        state.pos.y += state.vel.y;// * dt; //+ state.acc.y * 0.5 * dt*dt;
      }
      
      else {
        // Recall that this equation assumes constant acceleration! Not the case for springs!
        state.pos.x += state.old.vel.x * dt + state.acc.x * 0.5 * dt*dt;
        state.pos.y += state.old.vel.y * dt + state.acc.y * 0.5 * dt*dt;  
      }
      
      // Attached element must tag along
      if(body2Constant(body).attachedTo){
        var attachedTo = Globals.world.getBodies()[body2Constant(body).attachedTo];
        attachedTo.state.pos.x = state.pos.x;
        attachedTo.state.pos.y = state.pos.y;
      }
      
      state.angular.pos += state.angular.vel;
      state.old = temp;      
    }            
  }
};});
