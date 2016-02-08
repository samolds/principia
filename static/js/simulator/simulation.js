/*
  simulation.js -- 
  This file contains functions related to running (but not displaying) the underlying simulation.
*/

// Attempts to run a simulation using the currently defined keyframes and variables.
// A user can only access the timeline if this method succeeds.
function attemptSimulation(){
  
  var world          = Globals.world;
  var solver         = Globals.solver;
  var keyframeStates = Globals.keyframeStates;
  var nKF            = Globals.numKeyframes;
  var constants      = Globals.bodyConstants;
    
  if(Globals.originObject === 0 || Globals.originObject){
    var pre = Globals.dPrecision;
    // Hard-coded example for using polar coordinates
    
    // Disable collisions
    world.getBodies()[0].treatment = "ghost";
    world.getBodies()[1].treatment = "ghost";
    
    // Variables should be easier to generalize than the S.o.E., but for now,
    // assume body 0 is the coast guard and body 1 is the other boat.
    var coast_guard = Globals.world.getBodies()[0].state;
    var other_boat  = Globals.world.getBodies()[1].state;
    
    // Read in x0 vx, y0 vy, C (First 4 are from other boat, C is coast guard speed)
    var x0 = other_boat.pos.x - Globals.origin[0];
    var y0 = other_boat.pos.y - Globals.origin[1];
    var vx = other_boat.vel.x;   
    var vy = other_boat.vel.y;       
    var C  = coast_guard.vel.x;
    
    var polar_pos = cartesian2Polar([x0, y0]);
    var polar_vel = cartesian2Polar([vx, vy]);
        
    // This is the gross hard-coded math that doesn't generalize yet, but can at least
    // work with other values for the same type of problem.
    var termA = 2*y0*vy + 2*x0*vx;
    var termB = -(C*C) + vx*vx + vy*vy;    
    
    var term1 = termA*termA;
    var term2 = -4*(x0*x0 + y0*y0)*termB;
    var term3 = -termA;
    var term4 = 2*termB;
    
    // Solve for the time it takes the boats to intersect using S.o.E.
    var t = -1 * (Math.sqrt(term1 + term2) - term3)/term4;
    
    // Plug t back into either equation of motion for a heading
    var heading = rad2deg(Math.acos((x0 + vx*t)/(C*t)));
    
    
  
    // MathJax output, assign appropriate globals to allow simulation to run    
    $("#solution-details")[0].textContent += ("Solved for $t$, it is " + t.toFixed(pre) + ".\n");
    $("#solution-details")[0].textContent += ("Use the following system of equations, substituting out $ \\theta $:\n");
    $("#solution-details")[0].textContent += ("[1] $x_2 + {v_x}_2*t = {v}_1 * cos( \\theta ) * t$\n");
    $("#solution-details")[0].textContent += ("[2] $y_2 + {v_y}_2*t = {v}_1 * sin( \\theta ) * t$\n");
    $("#solution-details")[0].textContent += ("Known values:\n");
    $("#solution-details")[0].textContent += ("$v_1$ = " + C.toFixed(pre) + "\n");
    $("#solution-details")[0].textContent += ("$x_2$ = " + x0.toFixed(pre) + " (from "  + polar_pos[0].toFixed(pre)  + "* cos(" + polar_pos[1].toFixed(pre) + ") )\n");
    $("#solution-details")[0].textContent += ("$y_2$ = " + -y0.toFixed(pre) + " (from "  + polar_pos[0].toFixed(pre)  + "* sin(" + polar_pos[1].toFixed(pre) + ") )\n");
    $("#solution-details")[0].textContent += ("${v_x}_2$ = " + vx.toFixed(pre) + " (from "  + polar_vel[0].toFixed(pre)  + "* cos(" + polar_vel[1].toFixed(pre) + ") )\n");
    $("#solution-details")[0].textContent += ("${v_y}_2$ = " + -vy.toFixed(pre) + " (from "  + polar_vel[0].toFixed(pre)  + "* sin(" + polar_vel[1].toFixed(pre) + ") )\n");
    
    $("#solution-details")[0].textContent += ("Solved for heading, it is " + (90-heading).toFixed(pre) + ".\n");
    $("#solution-details")[0].textContent += ("Use EQ[1] := $x_2 + {v_x}_2*t = {v}_1 * cos(\\theta) * t$\n");
    $("#solution-details")[0].textContent += ("Known values:\n");
    $("#solution-details")[0].textContent += ("All previous values and $t$ = " + t.toFixed(pre) + "\n");
    $("#solution-details")[0].textContent += ("The heading is 90 - " + heading.toFixed(pre) + " (" + (90- heading).toFixed(pre) +") degrees east of north.");
                
    Globals.keyframeTimes[1] = t;
    $('#keyframe-1-dt').val(t.toFixed(pre));                   
    Globals.totalFrames = Math.floor(t/Globals.world.timestep());
    $('#simulatorFrameRange')[0].max = Globals.totalFrames;  
    Globals.keyframes[1] = Globals.totalFrames;
    
    var result = polar2Cartesian([C, heading]);
    Globals.keyframeStates[0][0].vel.x = result[0];
    Globals.keyframeStates[0][0].vel.y = result[1];
    Globals.variableMap[0][0].velx = result[0];
    Globals.variableMap[0][0].vely = result[1];
    
    // If results are sound, the user can play the simulation  
    simulate();
    
    Globals.keyframeStates[1][0].pos.x = Globals.states[0][Globals.totalFrames].pos.x;
    Globals.keyframeStates[1][0].pos.y = Globals.states[0][Globals.totalFrames].pos.y;
    Globals.keyframeStates[1][0].vel.x = Globals.states[0][Globals.totalFrames].vel.x;
    Globals.keyframeStates[1][0].vel.y = Globals.states[0][Globals.totalFrames].vel.y;
    Globals.keyframeStates[1][1].pos.x = Globals.states[1][Globals.totalFrames].pos.x;
    Globals.keyframeStates[1][1].pos.y = Globals.states[1][Globals.totalFrames].pos.y;
    Globals.keyframeStates[1][1].vel.x = Globals.states[1][Globals.totalFrames].vel.x;
    Globals.keyframeStates[1][1].vel.y = Globals.states[1][Globals.totalFrames].vel.y;
    
    // Draw keyframes in reverse order to update all the mini-canvases and so that we end up at t=0
    for(var i=nKF-1; i >= 0; i--){
      setStateKF(i);
      world.render();
      viewportToKeyCanvas(i);
    }
    
    $("#" + "keyframe-0").attr("style","border:4px solid #0000cc");
    for(var i=1; i < nKF; i++)
      $("#" + "keyframe-" + i).attr("style","");
    Globals.keyframe = 0;
    Globals.timelineReady = true;
    drawMaster(); 
    
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"solution-details"]);
    return;
  }
  
  // Do (N-1) passes, ensuring each adjacent pair of keyframes is dealt with
  // and data is potentially propagated from first and last keyframes in worst case.
  for(var pass=0; pass < nKF-1; pass++){
    for(var keyframe1 = 0; keyframe1 < nKF - 1; keyframe1++)
    {
      // Pick a pair of adjacent keyframes
      var keyframe2 = keyframe1 + 1;
        
      // Store the time associated with each keyframe
      var t1 = Globals.keyframeTimes[keyframe1];        
      var t2 = Globals.keyframeTimes[keyframe2];
        
      // Store the variables and constants associated with each body for each keyframe
      var kf1_variables = Globals.variableMap[keyframe1];
      var kf2_variables = Globals.variableMap[keyframe2];
                
      // For each body...
      for(var body = 0; body < constants.length; body++){ 
        // Constants associated with one body
        var bc = constants[body];
          
        // For now, solver will only fill in unknowns for point mass
        if(!bc.ctype == "kinematics1D-mass"){
          continue;
        }
        
        // Store positions
        var x0 = kf1_variables[body].posx;
        var xf = kf2_variables[body].posx;          
        var y0 = kf1_variables[body].posy;
        var yf = kf2_variables[body].posy;
        
        // Store velocities
        var vx0 = kf1_variables[body].velx;
        var vxf = kf2_variables[body].velx;
        var vy0 = kf1_variables[body].vely;
        var vyf = kf2_variables[body].vely;
        
        // Store acceleration
        var ax = kf1_variables[body].accx;
        var ay = kf1_variables[body].accy;
        
        // Store time
        var t = Globals.keyframeTimes[keyframe2];
                    
        // Prepare solver input
        var variables = { x0:x0, xf:xf, 
                          y0:y0, yf:yf,
                          vx0:vx0, vxf:vxf,
                          vy0:vy0, vyf:vyf,
                          ax:ax, ay:ay,
                          t:t
        };
          
        // Remove unknown values from solver input
        // The solver should return the unknown values
        var removals = [];
        for(var key in variables){
          if(variables[key] == "?" || variables[key] === false || isNaN(variables[key]))
            removals.push(key);
        }
        for(var j=0; j<removals.length; j++){
          delete variables[removals[j]];
        }
      
        // Run solver if previous step resulted in any removals (relate equations to origin here?)      
        var results = solver.solve(variables);
                  
        // Missing results on final pass
        if(!results[0] && pass == nKF-2){
          $("#solution-details")[0].textContent += "Error! There is insufficient data to solve for all unknowns.";
          Globals.timelineReady = false;
          return;
        }        
          
        // Note: Consistency check should ensure "solved" times are all equal
        if(!Globals.keyframeTimes[keyframe2]){
          
          /*
          if(results[1]["t"] < 0){
            $("#solution-details")[0].textContent += "Error! You would need to reverse time to get to keyframe " + keyframe2 + "!";
            Globals.timelineReady = false;
            return;
          }
          */
          
          Globals.keyframeTimes[keyframe2] = results[1]["t"];
          $('#keyframe-' + keyframe2 +'-dt').val(Globals.keyframeTimes[keyframe2]);          
          if(keyframe2 == nKF-1)
            Globals.totalFrames = results[1]["t"]/Globals.world.timestep();          
        }
               
        keyframeStates[keyframe1][body]["pos"]["x"] = results[1]["x0"];
        keyframeStates[keyframe1][body]["pos"]["y"] = results[1]["y0"];
        keyframeStates[keyframe1][body]["vel"]["x"] = results[1]["vx0"];
        keyframeStates[keyframe1][body]["vel"]["y"] = results[1]["vy0"];

        kf1_variables[body].posx = results[1]["x0"];
        kf1_variables[body].posy = results[1]["y0"];
        kf1_variables[body].velx = results[1]["vx0"];
        kf1_variables[body].vely = results[1]["vy0"];
        
        keyframeStates[keyframe2][body]["pos"]["x"] = results[1]["xf"];
        keyframeStates[keyframe2][body]["pos"]["y"] = results[1]["yf"];
        keyframeStates[keyframe2][body]["vel"]["x"] = results[1]["vxf"];
        keyframeStates[keyframe2][body]["vel"]["y"] = results[1]["vyf"];
        
        kf2_variables[body].posx = results[1]["xf"];
        kf2_variables[body].posy = results[1]["yf"];
        kf2_variables[body].velx = results[1]["vxf"];
        kf2_variables[body].vely = results[1]["vyf"];
        
        if(bc.alpha)
          delete bc.alpha;
        
        
      } // End for-each body
    } // End for-each keyframe
  } // End for-each pass
  
  $('#simulatorFrameRange')[0].max = Globals.totalFrames;

  // Draw keyframes in reverse order to update all the mini-canvases and so that we end up at t=0
  for(var i=nKF-1; i >= 0; i--){
    setStateKF(i);
    world.render();
    viewportToKeyCanvas(i);
  }
  
  // Run the simulation using the solved keyframes
  simulate();
  
  // If results are sound, the user can play the simulation  
  $("#" + "keyframe-0").attr("style","border:4px solid #0000cc");
  for(var i=1; i < nKF; i++)
    $("#" + "keyframe-" + i).attr("style","");
  
  Globals.keyframe = 0;
  Globals.timelineReady = true;
  drawMaster(); 
}

function cloneVariable(variable){
  var out = {};
  for(var key in variable)
    out[key] = variable[key]
  return out;
}

// Adds a variable object to each keyframe
function addToVariableMap(variable){
  for(var i=0; i < Globals.numKeyframes; i++){
    Globals.variableMap[i].push(cloneVariable(variable));
  }
}

function pushDuplicates(){
  // Previous keyframe, with one variable map per body
  var lastMap = Globals.variableMap[Globals.numKeyframes-1];
  var cloneMap = [];
  for(var i=0; i<lastMap.length; i++)
    cloneMap.push(cloneVariable(lastMap[i]));
  Globals.variableMap.push(cloneMap);
  
  var lastKeyframeState = Globals.keyframeStates[Globals.numKeyframes-1];
  var KF = [];
  for(var j=0; j < lastKeyframeState.length; j++)
  {
    var state = lastKeyframeState[j];
    KF.push(cloneState(state));
  }
  
  Globals.keyframeStates.push(KF);
 
  // If mini-canvases exist, paint to them now
  if(Globals.useKeyframes){
    setStateKF(Globals.numKeyframes);
    Globals.world.render();
    viewportToKeyCanvas(Globals.numKeyframes);
  }
    
  Globals.keyframes.push(false);
  Globals.keyframeTimes.push(false);
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
  var keyframe = Globals.keyframe;
  var i = bIndex(body);
  value = parseFloat(value);  
  variableMap[keyframe][i][variable] = isNaN(value)? "?": value;
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
  for (var i = 0; i < bodies.length; i++){
    bodies[i].state = Globals.states[i][n];
    if(i == Globals.originObject){
      Globals.origin = [bodies[i].state.pos.x, bodies[i].state.pos.y];
    }
  }
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
  if(Globals.useKeyframes && body) updateVariable(body, property, value);

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
          
          if(i === Globals.originObject)          
            Globals.origin[0] = valuef;
        }
        break;
      case 'posy':
        if(isNaN(valuef))
          body2Constant(body).alpha = 0.5;
        else {
          body.state.pos.y = valuef;
          kState[i].pos.y = valuef;
          
          if(i === Globals.originObject)          
            Globals.origin[1] = valuef;
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
  if(!Globals.useKeyframes && !Globals.didMove && doSimulate) {
    
    if(Globals.bodyConstants[i].alpha)
      delete Globals.bodyConstants[i].alpha; // No alpha value if need to simulate
    
    simulate();  
  }
  
  if($('#properties-position-x').val() != "" && $('#properties-position-y').val() != "" && Globals.bodyConstants[i].alpha)
     delete Globals.bodyConstants[i].alpha;

   resetSaveButton();
}

function resetSaveButton(){
  $("#save-button").removeClass( "green" );
  $("#save-button").addClass( "blue" );
}

// Custom integrator: On each iteration, updates velocity then position of each component
// TODO: Change to Runge-Kutta
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