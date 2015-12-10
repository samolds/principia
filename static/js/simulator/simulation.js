/*
  simulation.js -- 
  This file contains functions related to running (but not displaying) the underlying simulation.
*/

// Attempts to run a simulation using the currently defined keyframes and variables.
// A user can only access the timeline if this method succeeds.
function attemptSimulation(){
  var world = Globals.world;
  var solver = Globals.solver;
  var keyframeStates = Globals.keyframeStates;

  if(world.getBodies().length < 1) return;

  if(Globals.keyframeTimes[1]){
    Globals.totalFrames = Globals.keyframeTimes[1]/Globals.world.timestep();
  }
  
  for(var i=0; i < Globals.variableMap.length; i++){
  
    // For now, solver will only fill in unknowns for point mass
    if(!Globals.bodyConstants[i].ctype == "kinematics1D-mass"){
      continue;
    }
  
    var variables = Globals.variableMap[i];
    removals = [];
    for(var variable in variables){
      if(variables[variable] == "?")
        removals.push(variable);
    }
    
    // Remove unknowns from variable map
    for(var j=0; j<removals.length; j++){
      delete variables[removals[j]];
    }
    
    // Add time if known
    if(Globals.keyframeTimes[1]) // TODO: Generalize this
      variables["t"] = Globals.keyframeTimes[1];
  
    // Solve for unknowns, store results
    var results = solver.solve(variables);
    
    // Update format of solution details
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"solution-details"]);
  
    if(!results[0])
    {
      $("#solution-details")[0].textContent += "Error! There is insufficient data to solve for all unknowns.";
      Globals.timelineReady = false;
      return;
    }  
    
    Globals.variableMap[i] = results[1];
  
    // TODO: Check if the results are sound and all variables are known
    // TODO: Update display of keyframe images to match results
  
    // Note: Consistency check should ensure "solved" times are all equal
    if(!Globals.keyframeTimes[1]){
      if(results[1]["t"] < 0)
      {
        $("#solution-details")[0].textContent += "Error! You would need to reverse time to get to the final keyframe!";
        Globals.timelineReady = false;
        return;
      }
  
      Globals.keyframeTimes[1] = results[1]["t"];
      Globals.totalFrames = results[1]["t"]/Globals.world.timestep();
    }  
    
    // Modify bodies within keyframes to match results
    if(Globals.bodyConstants[i].ctype == "kinematics1D-mass"){
      keyframeStates[0][i]["pos"]["x"] = results[1]["x0"];
      keyframeStates[0][i]["pos"]["y"] = results[1]["y0"];
      keyframeStates[0][i]["vel"]["x"] = results[1]["vx0"];
      keyframeStates[0][i]["vel"]["y"] = results[1]["vy0"];

      keyframeStates[1][i]["pos"]["x"] = results[1]["xf"];
      keyframeStates[1][i]["pos"]["y"] = results[1]["yf"];
      keyframeStates[1][i]["vel"]["x"] = results[1]["vxf"];
      keyframeStates[1][i]["vel"]["y"] = results[1]["vyf"];

      keyframeStates[0][i]["acc"]["x"] = results[1]["ax"];
      keyframeStates[0][i]["acc"]["x"] = results[1]["ax"];
      keyframeStates[1][i]["acc"]["y"] = results[1]["ay"];
      keyframeStates[1][i]["acc"]["y"] = results[1]["ay"];
      
      if(Globals.bodyConstants[i].alpha)
        delete Globals.bodyConstants[i].alpha;
    }
  }
  
  $('#keyframe-1-dt').val(Globals.keyframeTimes[1]);
  $('#simulatorFrameRange')[0].max = Globals.totalFrames;
  
  
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
  $("#" + "keyframe-0").attr("style","border:4px solid #0000cc");
  $("#" + "keyframe-1").attr("style","");
  Globals.keyframe = 0;
  Globals.timelineReady = true;
  Globals.keyframes[1] = Globals.totalFrames;
  drawMaster();
}

// Having solved for all variable, iterates through the simulation states and saves all resulting frames.
function simulate(){
  var i;
  var j;

  // Reset timeline if it is running
  Globals.frame = 0;
  if (Globals.running) { toggleSimulator(); }
  $("#simulatorFrameRange").val(0);

  Globals.states = [];  // Clear states global
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

// Updates a variable in the specified body to have the specified value
function updateVariable(body, variable, value){
  var variableMap = Globals.variableMap;
  var i = bIndex(body);
  
  value = isNaN(value)? "?": parseFloat(value);
  
  if(Globals.keyframe == 0){
    if(variable == "posx") variableMap[i]["x0"] = value;
    if(variable == "velx") variableMap[i]["vx0"] = value;
    if(variable == "posy") variableMap[i]["y0"] = value;
    if(variable == "vely") variableMap[i]["vy0"] = value;
  }
  else {
    if(variable == "posx") variableMap[i]["xf"] = value;
    if(variable == "velx") variableMap[i]["vxf"] = value;
    if(variable == "posy") variableMap[i]["yf"] = value;
    if(variable == "vely") variableMap[i]["vyf"] = value;
  }
  
  if(variable == "accx") variableMap[i]["ax"] = value;
  if(variable == "accy") variableMap[i]["ay"] = value;
  
  if(variable == "k") variableMap[i]["k"] = value;
}

// Set the state of the world to match keyframe n
function setStateKF(n){
  
  // TODO: Map n to the appropriate index
  if(n > 0) n = 1;
  
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

// Adds the specified components to each keyframe and redraws the mini canvases
function updateKeyframes(components){
  var world = Globals.world;
  var nKF = Globals.keyframeStates.length;
  var KFs = Globals.keyframeStates;
  components = components || []; // Provide empty list if no parameter is provided
  
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

// Handler for updating a property to have a specific value
// All updates to pos/vel/acc should be routed through here
// doSimulate can be set to true to immediately resimulate with the changed property
function onPropertyChanged(property, value, doSimulate){
  if(!Globals.canEdit()) return;
  
  // Invalidate the timeline if in keyframe mode
  if(Globals.useKeyframes) Globals.timelineReady = false;
  
  var world = Globals.world;
  var bodies = world.getBodies();
  var body = Globals.selectedBody;  
  var i = world.getBodies().indexOf(body);
  var kState = Globals.keyframeStates[Globals.keyframe];
  
  // Parse the value, assigning NaN if the parse fails
  var valuef = parseFloat(value);
 
  // Attempt to update the corresponding variable
  if(Globals.useKeyframes) updateVariable(body, property, value);

  
  
  if(!isNaN(valuef))
  {
    if(property == 'gravityx')
      Globals.gravity[0] = valuef;        
    if(property == 'gravityy')      
      Globals.gravity[1] = valuef;
  }

  var canvas = document.getElementById('viewport');
  var canvas2d = canvas.children[0].getContext('2d');
  if (body) {
    switch(property)
    {    
      case 'posx':

        if(isNaN(valuef))
          body2Constant(body).alpha = 0.5;
        else {                    
          body.state.pos.x = valuef;          
          kState[i].pos.x = valuef;
        }
        break;
      case 'posy':
        if(isNaN(valuef))
          body2Constant(body).alpha = 0.5;
        else {
          body.state.pos.y = valuef;
          kState[i].pos.y = valuef;
        }
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
      case 'image':
        var img = document.createElement("img");
        img.setAttribute("width", Globals.bodyConstants[i].size/100 * 50);
        img.setAttribute("height", Globals.bodyConstants[i].size/100 * 50);
        img.setAttribute("src", Globals.massImages[valuef]);
        body.view = img;
        body.view.onload = function() { updateKeyframes(); drawMaster(); }  
        Globals.bodyConstants[i].img = valuef;
        return;      
      case 'size':
        if(valuef < 50 || valuef > 500 || isNaN(valuef)) valuef = 100;
        Globals.bodyConstants[i]["size"] = valuef;
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
  
  if($('#properties-position-x').val() != "" && $('#properties-position-y').val() != "")
     delete Globals.bodyConstants[i].alpha;
}

// Custom integrator: On each iteration, updates velocity then position of each component
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