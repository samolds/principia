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

function updateKeyframes(components)
{
  var world = Globals.world;
  var nKF = Globals.keyframeStates.length;
  var KFs = Globals.keyframeStates;
        
  // Must enforce invariant: Index of body in keyframe states must match index of body in world.getBodies()
  // Add the body to every keyframe and update that world state's rendering
  for(var i=0; i < nKF; i++){
    for(var j=0; j < components.length; j++)
    {
      var component = components[j];
      KFs[i].push(cloneState(component.state)); 
    }
 
    // If mini-canvases exist, paint to them now
    if(Globals.useKeyframes){
      setStateKF(i);
      world.render();
      viewportToKeyCanvas(i);
    }
  } 
}

function onPropertyChanged(property, value, doSimulate){
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
        body.state.pos.x = valuef;
        kState[i].pos.x = valuef;
        break;
      case 'posy':
        body.state.pos.y = valuef;
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
        img.setAttribute("width", Globals.bodyConstants[i].size/100 * 50);
        img.setAttribute("height", Globals.bodyConstants[i].size/100 * 50);
        img.setAttribute("src", Globals.massImages[valuef]);
        body.view = img;
        body.view.onload = function() { drawMaster(); }  
        Globals.bodyConstants[i].img = valuef;
        return;      
      case 'size':
        Globals.bodyConstants[i]["size"] = value;
        body.view.setAttribute("width", Globals.bodyConstants[i].size/100 * 50);
        body.view.setAttribute("height", Globals.bodyConstants[i].size/100 * 50);
        body.radius = Globals.bodyConstants[i].size/100 * 25;
        body.view.onload = function() { drawMaster(); }      
        return;
      default:
        Globals.bodyConstants[i][property] = value;
        break;
    }
  }
  
  // Rerun the simulation using updated properties if not using keyframes
  if(!Globals.useKeyframes && !Globals.didMove && doSimulate) simulate();
}

Physics.integrator('principia-integrator', function( parent ){  
  return {  
  // Velocity increases by acceleration * dt
  integrateVelocities: function( bodies, dt ){
		
    // TODO: Apply forces to modify acceleration before integrating velocity
    
    
    for ( var i = 0, l = bodies.length; i < l; ++i ){
      var body = bodies[i];
      var spring_a = applySpringForces(body);
      var state = body.state;	      
      state.old = cloneState(body.state);
      
      state.vel.x += state.acc.x * dt + spring_a[0];
      state.vel.y += state.acc.y * dt + spring_a[1];
      
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
      
      if(Globals.bodyConstants[i].attachedTo) {        
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