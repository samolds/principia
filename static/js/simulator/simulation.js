/*
  simulation.js -- 
  This file contains functions related to running (but not displaying) the underlying simulation.
*/

/* 
  Attempts to run a simulation using the currently defined keyframes and variables.
  A user can only access the timeline if this method succeeds.
*/
function attemptSimulation(){
  
  var world          = Globals.world;
  var solver         = Globals.solver;
  var keyframeStates = Globals.keyframeStates;
  var nKF            = Globals.numKeyframes;
  var constants      = Globals.bodyConstants;
  var pre            = Globals.dPrecision;
  
  if(Globals.loading) return;
  
  // Handle case that an object has been selected as the origin
  if(Globals.originObject !== false && nKF > 1){
    collisionSolver();
    return;
  }
  
  // Handle multi-keyframe case
  if(nKF > 1)
  {
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
        for(var body = 1; body < constants.length; body++){ 
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
          if(t === false) t = "?";
                
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
            if(isNaN(variables[key]))
              removals.push(key);
          }
          for(var j=0; j<removals.length; j++){
            delete variables[removals[j]];
          }
                    
          
          if(removals.length != 0){            
              
            // Run solver if previous step resulted in any removals (relate equations to origin here?)      
            var results = solver.solve(variables);
                      
            // Missing results on final pass
            if(!results[0] && pass == nKF-2){
              $("#solution-details")[0].textContent += "Error! There is insufficient data to solve for all unknowns.\n";
              MathJax.Hub.Queue(["Typeset", MathJax.Hub, "solution-details"]);
              Globals.timelineReady = false;
              return;
            }        
              
            
            if(!Globals.keyframeTimes[keyframe2]){            
              Globals.keyframeTimes[keyframe2] = results[1]["t"] + Globals.keyframeTimes[keyframe1];
            
              // Consistency check: time should always progress forward
              if(results[1]["t"] <= 0 || Globals.keyframeTimes[keyframe2] <= Globals.keyframeTimes[keyframe1]){
                $("#solution-details")[0].textContent += "Error! You would need to reverse time to get to keyframe " + (keyframe2+1) + "!\n";
                Globals.keyframeTimes[keyframe2] = false;
                Globals.timelineReady = false;
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, "solution-details"]);
                return;
              }
              
              $('#keyframe-' + keyframe2 +'-dt').val(Globals.keyframeTimes[keyframe2].toFixed(pre));          
              if(keyframe2 == nKF-1)
                Globals.totalFrames = Math.ceil(Globals.keyframeTimes[keyframe2]/Globals.world.timestep());
            }
  
            // Update initial keyframe states to match solved results
            keyframeStates[keyframe1][body]["pos"]["x"] = results[1]["x0"];
            keyframeStates[keyframe1][body]["pos"]["y"] = swapYpos(results[1]["y0"], false);
            keyframeStates[keyframe1][body]["vel"]["x"] = results[1]["vx0"];
            keyframeStates[keyframe1][body]["vel"]["y"] = -results[1]["vy0"];

            // Update initial keyframe variables to match solved results
            kf1_variables[body].posx = results[1]["x0"];
            kf1_variables[body].posy = results[1]["y0"];
            kf1_variables[body].velx = results[1]["vx0"];
            kf1_variables[body].vely = results[1]["vy0"];
            
            // Update final keyframe states to match solved results
            keyframeStates[keyframe2][body]["pos"]["x"] = results[1]["xf"];
            keyframeStates[keyframe2][body]["pos"]["y"] = swapYpos(results[1]["yf"], false);
            keyframeStates[keyframe2][body]["vel"]["x"] = results[1]["vxf"];
            keyframeStates[keyframe2][body]["vel"]["y"] = -results[1]["vyf"];
            
            // Update final keyframe variables to match solved results
            kf2_variables[body].posx = results[1]["xf"];
            kf2_variables[body].posy = results[1]["yf"];
            kf2_variables[body].velx = results[1]["vxf"];
            kf2_variables[body].vely = results[1]["vyf"];
          }  
          
          else
          {            
            //$("#solution-details")[0].textContent += "No values are unknown.\n";
          }
          
          if(bc.alpha)
            delete bc.alpha;
          
          
        } // End for-each body
      } // End for-each keyframe
    } // End for-each pass
            
    // Update the range with the solved number of frames
    $('#simulatorFrameRange')[0].max = Globals.totalFrames;
    
    // Associate keyframes with a real frame
    for(var i=1; i < nKF; i++)
      if(Globals.keyframes[i] === false)
        Globals.keyframes[i] = Math.floor(Globals.keyframeTimes[i]/Globals.keyframeTimes[nKF-1] * Globals.totalFrames);
    
    // Draw keyframes in reverse order to update all the mini-canvases and so that we end up at t=0
    Globals.frame = false;
    for(var i=nKF-1; i >= 0; i--){
      Globals.keyframe = i;
      drawMaster();
    }
  }
  
  // Run the simulation using the solved keyframes
  // If results are sound, the user can play the simulation
  simulate();
  
  // Update the simulation render
  drawMaster();  
  updateRangeLabel();
  
  // Typeset any MathJax
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, "solution-details"]);
}

/*
  Special case of the solver to handle computing a heading for when two bodies collide
*/
function collisionSolver(){
  var world          = Globals.world;
  var solver         = Globals.solver;
  var keyframeStates = Globals.keyframeStates;
  var nKF            = Globals.numKeyframes;
  var constants      = Globals.bodyConstants;
  var pre            = Globals.dPrecision;
  
  if(Globals.world.getBodies().length != 3) return;
  
  // Hard-coded example for using polar coordinates  
  // Disable collisions
  world.getBodies()[1].treatment = "ghost";
  world.getBodies()[2].treatment = "ghost";
  
  // Variables should be easier to generalize than the S.o.E., but for now,
  // assume body 1 is the origin and body 2 is the target
  var coast_guard = world.getBodies()[1].state;
  var other_boat  = world.getBodies()[2].state;
  
  // Read in x0 vx, y0 vy, C (First 4 are from target, C is speed of origin)
  var x0 = other_boat.pos.x - Globals.origin[0];
  var y0 = swapYpos(other_boat.pos.y, false) - Globals.origin[1];
  var vx = other_boat.vel.x;
  var vy = -other_boat.vel.y;
  var C  = coast_guard.vel.x;
  
  var polar_pos = cartesian2Polar([x0, y0]);
  var polar_vel = cartesian2Polar([vx, vy]);
      
  // This is the gross hard-coded math that doesn't generalize well yet, but can at least
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
  MathJax.Hub.queue.Push(function()
  {    
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
    $("#solution-details")[0].textContent += ("The heading is 90 - " + heading.toFixed(pre) + " (" + (90- heading).toFixed(pre) +") degrees east of north.\n");
  });
  
  Globals.keyframeTimes[1] = t;
  $('#keyframe-1-dt').val(t.toFixed(pre));                   
  Globals.totalFrames = Math.floor(t/Globals.world.timestep());
  $('#simulatorFrameRange')[0].max = Globals.totalFrames;  
  Globals.keyframes[1] = Globals.totalFrames;
  
  var result = polar2Cartesian([C, heading]);
  
  Globals.keyframeStates[0][1].vel.x = result[0];
  Globals.keyframeStates[0][1].vel.y = -result[1];
  Globals.variableMap[0][1].velx = result[0];
  Globals.variableMap[0][1].vely = result[1];
  
  // If results are sound, the user can play the simulation    
  simulate();
  
  // Final position of both boats
  var fx = Globals.keyframeStates[0][1].pos.x + Globals.keyframeStates[0][1].vel.x * t;
  var fy = Globals.keyframeStates[0][1].pos.y + Globals.keyframeStates[0][1].vel.y * t;
  
  // Save solved vales in keyframe states
  Globals.keyframeStates[1][1].pos.x = fx;
  Globals.keyframeStates[1][1].pos.y = fy;
  Globals.keyframeStates[1][1].vel.x = result[0];
  Globals.keyframeStates[1][1].vel.y = -result[1];
  Globals.keyframeStates[1][2].pos.x = fx;
  Globals.keyframeStates[1][2].pos.y = fy;
  Globals.keyframeStates[1][2].vel.x = vx;
  Globals.keyframeStates[1][2].vel.y = -vy;
  
  // Draw keyframes in reverse order to update all the mini-canvases and so that we end up at t=0
  Globals.frame = false;
  for(var i=nKF-1; i >= 0; i--){      
    Globals.keyframe = i;
    drawMaster();
  }
  
  // Highlight and render the first frame
  highlightKeycanvas(0);
  Globals.keyframe = 0;
  Globals.timelineReady = true;
  drawMaster(); 
  
  // Typeset the math
  MathJax.Hub.Queue(["Typeset",MathJax.Hub,"solution-details"]);
}

/*
  Creates a shallow copy of the specified variable
*/
function cloneVariable(variable){
  var out = {};
  for(var key in variable)
    out[key] = variable[key]
  return out;
}

/*
  Adds a variable object to each keyframe
*/
function addToVariableMap(variable){
  for(var i=0; i < Globals.numKeyframes; i++)
    Globals.variableMap[i].push(cloneVariable(variable));
}

/*
  Pushes a duplicate variable map and keyframe state; used when
  adding a new keyframe so that it ends up with the same bodies.
*/
function pushDuplicates(){
  // Previous keyframe, with one variable map per body
  // The variable map is already built if simulation is being loaded
  if(!Globals.loading){
    // If this is an active simulation, the variables must be copied to the new keyframe
    var lastMap = Globals.variableMap[Globals.numKeyframes-1];
    var cloneMap = [];
    for(var i=0; i<lastMap.length; i++)
      cloneMap.push(cloneVariable(lastMap[i]));
    Globals.variableMap.push(cloneMap);
  }
  
  var lastKeyframeState = Globals.keyframeStates[Globals.numKeyframes-1];
  var KF = [];
  for(var j=0; j < lastKeyframeState.length; j++)
  {
    var state = lastKeyframeState[j];
    KF.push(cloneState(state));
  }
  
  Globals.keyframeStates.push(KF);  
  Globals.keyframes.push(false);
  Globals.keyframeTimes.push(false);
  
  Globals.keyframe = Globals.numKeyframes;
  highlightKeycanvas(Globals.keyframe);
  drawMaster();
  
  Globals.timelineReady = false;
}

/* 
  Having solved for all variables, iterates through the simulation states and saves all resulting frames.
*/
function simulate(){
  var i;
  var j;
  
  // Prevent simulation while resizing
  if(Globals.resizing) return;
  
  // Hard-code simulating max frames if there is one keyframe
  if(Globals.numKeyframes == 1)
    Globals.totalFrames = Globals.maxFrames;
  
  // Reset timeline if it is running
  Globals.frame = 0;
  if (Globals.running) { toggleSimulator(); }
  $("#simulatorFrameRange").val(0);

  Globals.states = [];  // Clear states global

  // Used for state graph
  Globals.positionStates = [];
  Globals.velocityStates = [];
  Globals.accelStates = [];

  Globals.world._time = 0;

  var old = defaultState();

  // Restore objects to their initial state
  var initStates = Globals.keyframeStates[0];
  for (i = 0; i < Globals.world.getBodies().length; i++) {
    Globals.world.getBodies()[i].state = cloneState(initStates[i]);
    Globals.world.getBodies()[i].state["old"] = cloneState(old);
    Globals.world.getBodies()[i]._started = undefined;
    Globals.states[i] = [];
    Globals.positionStates[i] = [];
    Globals.velocityStates[i] = [];
    Globals.accelStates[i] = [];
  }
  
  // For each frame and then for each body in the simulation
  for (i = 0; i < Globals.totalFrames+1; i++){    
    for (j = 0; j < Globals.world.getBodies().length; j++){
      // Clone the state information for the current body
      
      // Added 2/8/16: Swap to new keyframe state at appropriate indices before proceeding
      if(($.inArray(i, Globals.keyframes) != -1))
      {
        // Restore objects to their keyframe state
        var kfStates = Globals.keyframeStates[kIndex(i)];
        for (var b = 0; b < Globals.world.getBodies().length; b++) {
          Globals.world.getBodies()[b].state = cloneState(kfStates[b]);
          Globals.world.getBodies()[b].state["old"] = cloneState(old);
        }
      }
      
      var curState = Globals.world.getBodies()[j].state;
      var saveState = cloneState(curState);

      // Save state information and advance the simulator
      if (i != 0){ saveState["old"] = Globals.states[j][i-1]; }
      Globals.states[j].push(saveState);
      Globals.positionStates[j].push({ 
        x: i,
        y: Math.sqrt(Math.pow(swapYpos(Globals.states[j][i].pos.y, true), 2) + Math.pow(Globals.states[j][i].pos.x, 2))
      });
      Globals.velocityStates[j].push({ 
        x: i,
        y: Math.sqrt(Math.pow(Globals.states[j][i].vel.y, 2) + Math.pow(Globals.states[j][i].vel.x, 2))
      });
      Globals.accelStates[j].push({ 
        x: i,
        y: Math.sqrt(Math.pow(Globals.states[j][i].acc.y, 2) + Math.pow(Globals.states[j][i].acc.x, 2))
      });
    }
    
    // Integrates velocity/position
    Globals.world.step();
  }
  
  // Highlight the first frame and mark the timeline as ready
  highlightKeycanvas(0);    
  Globals.keyframe = 0;
  Globals.timelineReady = true;
}

/* 
  Updates a variable in the specified body to have the specified value 
*/
function updateVariable(body, variable, value){
  if(Globals.loading) return;
  var keyframe = (Globals.keyframe !== false)? Globals.keyframe: lastKF();  
  
  if(isNaN(value))
    Globals.variableMap[keyframe][bIndex(body)][variable] = "?";
  else {
    Globals.variableMap[keyframe][bIndex(body)][variable] = value;
  
    // Swap direction for y-velocity/acceleration (position is dealt with by caller)
    if(variable == "vely")
      Globals.variableMap[keyframe][bIndex(body)][variable] = -value;
    if(variable == "accy")
      Globals.variableMap[keyframe][bIndex(body)][variable] = -value;
  }
    
}

/*
  Set the state of the world to match keyframe n
*/
function setStateKF(n){
  var bodies = Globals.world.getBodies();
  for (var i = 0; i < bodies.length; i++){
    bodies[i].state = Globals.keyframeStates[n][i];
    if(i === Globals.originObject)
      Globals.origin = [bodies[i].state.pos.x, swapYpos(bodies[i].state.pos.y, false)];
  }
}

/* 
  Set the state of the world to match simulation frame n
*/
function setState(n){
  var bodies = Globals.world.getBodies();
  
  // Special case: Use the previous keyframe to place the origin
  // This may be overwritten in the loop if there is an origin object
  bodies[0].state = Globals.keyframeStates[lastKF()][0];
  
  for (var i = 1; i < bodies.length; i++){
    bodies[i].state = Globals.states[i][n];
    if(i === Globals.originObject)
      Globals.origin = [bodies[i].state.pos.x, swapYpos(bodies[i].state.pos.y, false)];
  }
}

/* 
  Adds the specified components to each keyframe and redraws the mini canvases
*/
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
 
    // If mini-canvases exist, paint to them now via drawMaster
    Globals.keyframe = i;
    drawMaster();    
  }

  // Mark the simulation as unsaved, highlight the latest keyframe, and repaint the screen
  if(nKF > 1){
    dirty();
    Globals.keyframe = getKF();
    highlightKeycanvas(Globals.keyframe);
    drawMaster();
  }
}

/*
  Updates global gravity in the specified coordinate to match the specified value
*/
function updateGravity(coordinate, value){
  value = parseFloat(value);  
  if(isNaN(value)) return;
    
  if(coordinate == "x")
    Globals.gravity[0] = value;
  else
    Globals.gravity[1] = value;
  
  if(Globals.numKeyframes > 1)
    Globals.timelineReady = false;
  else
    attemptSimulation();
}

/*
  Updates the size of the specified body (in px) to match the specified value (but scaled to current zoom level)
*/
function updateSize(body, value){
  if(!body) return;
  value = parseInt(value);
  value = isNaN(value) ? body2Constant(body).size : clamp(5, value, 500);
  var i = bIndex(body);
  Globals.bodyConstants[i].size = value;

  var scaledSize = value / getScaleFactor();
  if(bodyType(body) == "kinematics1D-pulley"){
    body.view.setAttribute("width", scaledSize*2);
    body.view.setAttribute("height", scaledSize*2);
  }
  else {
    body.view.setAttribute("width", scaledSize);
    body.view.setAttribute("height", scaledSize);
  }

  if (body2Constant(body).massType === "square") { // square point mass
    body.width = scaledSize;
    body.height = scaledSize;
    body.geometry.width = scaledSize;
    body.geometry.height = scaledSize;
  } else if(body2Constant(body).massType === "round"){ // round point mass
    body.radius = scaledSize / 2;
    body.geometry.radius = scaledSize / 2;
  }
  else { // pulley
    body.radius = scaledSize;
    body.geometry.radius = scaledSize;
  }    

  // Resimulate if there is only one keyframe
  if(Globals.numKeyframes == 1) attemptSimulation();

  drawMaster();
}

/*
  Updates the image used to dislay the specified body
*/
function updateImage(body, value){
  if(!body) return;
  
  var i = bIndex(body);
  var scaledSize = Globals.bodyConstants[i].size / getScaleFactor();

  // Create image element to be used
  var img = document.createElement("img");
  img.setAttribute("width", scaledSize);
  img.setAttribute("height", scaledSize);
  
  // Associate body with its image
  Globals.bodyConstants[i].img = isNaN(value)? value: parseInt(value);
  
  // Set the image element to display appropriately
  if(bodyType(body) !== "kinematics1D-mass")
    img.setAttribute("src", value);
  else
    img.setAttribute("src", Globals.massImages[parseInt(value)]);  
  
  // Update body's display and redraw
  body.view = img;
  body.view.onload = function() { 
    var old = getKF();
  
    // Also redraw all keyframes
    for(var i=0; i<Globals.numKeyframes; i++){
      Globals.keyframe = i;
      drawMaster();      
    }
  
    Globals.keyframe = old;  
    drawMaster(); 
  }
  
}

/*
  Handler for updating a property to have a specific value
  All updates to pos/vel/acc should be routed through here
  This function should be passed a canonical coordinate if modifying position
*/
function onPropertyChanged(i, property, value, doTranslation){
  var body = Globals.world.getBodies()[i];
  if(!body) return;
  
  if(body2Constant(body).attachedBody){
    onPropertyChanged(body2Constant(body).attachedBody, property, value, doTranslation);
  }
  
  // If not on a keyframe, update the property within the previous keyframe (relative to current frame)
  var keyframe = getKF();
  var kState = Globals.keyframeStates[keyframe];

  // Reparse the value, assigning NaN if the parse fails
  value = parseFloat(value);
  
  // Special case: Catch any attempts to modify 'x' properties of objects attached to a pulley
  // Objects attached to a pulley must hang directly above/below the point they are attached to
  var pulley = getAttachedPulley(body);
  if(pulley){
    if(property == "velx" || property == "accx")
      value = 0;
    if(property == "posx")
      value = getPulleySnapX(body) +
    ((Globals.didMove && bodyType(Globals.selectedBody) == "kinematics1D-pulley")? (Globals.translation.x*getScaleFactor()): 0);
  }
  
  // Must be updating one of these properties to allow setting to NaN 
  var allowed_variables =
  [
    "posx", "posy", "velx", "vely", "accx", "accy"
  ];
  
  // If the value is NaN but not allowed to be a variable, don't update it.
  if($.inArray(property, allowed_variables) === -1 && isNaN(value)) return;
  
  // Use the old value to prevent unknowns in the single keyframe case.
  if(isNaN(value) && Globals.numKeyframes === 1) value = getOldValue(body, property);
    
  // Invalidate the timeline
  dirty();
  
  // Attempt to update the corresponding variable with the canonical value
  if(bIndex(body) !== 0) updateVariable(body, property, value);
  
  // Update alpha channel appropriately, indicating whether the position is fully specified
  assignAlpha();
 
  // Don't do anything else if the value is unknown
  if(isNaN(value)) return;
 
  // Otherwise update the keyframe state or body constants with known value:
  switch(property){
    // Position updates
    case 'posx':        
        value = pixelTransform(value, "x", doTranslation); // Convert canonical x to pixel x for state/kstate!
        body.state.pos.x = value;
        kState[i].pos.x = value;
        
        // If this is a pulley, use the movePulley function so any attached bodies are also updated
        if(bodyType(body) == "kinematics1D-pulley") movePulley({body:body, x:value, y:body.state.pos.y});
        break;
    case 'posy':        
        value = pixelTransform(value, "y", doTranslation); // Convert canonical y to pixel y for state/kstate!
        body.state.pos.y = value;
        kState[i].pos.y = value;
        break;
      
    // Velocity and acceleration updates:
    case 'velx': kState[i].vel.x = value; break;
    case 'vely': kState[i].vel.y = value; break;
    case 'accx': kState[i].acc.x = value; break;
    case 'accy': kState[i].acc.y = value; break;
    
    // Surface-specific updates:
    case 'surfaceWidth':
    case 'surfaceHeight':
    case 'surfaceFriction':
      updateSurface(body, property, value);
      break;

    // Ramp-specific updates:
    case 'rampWidth':
    case 'rampHeight':
    case 'rampAngle':
    case 'rampFriction':
      updateRamp(body, property, value);
      break;

    // Default case: Assign a constant
    default: Globals.bodyConstants[i][property] = value; break;
  }
}

/*
  Marks the simulation as needing to be recalculated and unsaved
*/
function dirty(){
  if(Globals.numKeyframes == 1) return;  
  Globals.timelineReady = false;
  resetSaveButton();  
}

/*
  Adjusts the color of the save button
*/
function resetSaveButton(){
  $("#save-button").removeClass( "green" );
  $("#save-button").addClass( "blue" );
}

/*
  Computes the total acceleration of the specified body
*/
function totalAcceleration(body){
  var dt = Globals.world.timestep();
  var state = body.state;
  var spring_a = applySpringForces(body);
  var pulley = getAttachedPulley(body);
  var pulley_f = applyPulleyForces(body, dt);
  var pulley_a = getPulleyAcceleration(body, pulley_f);
  
  return {x:state.acc.x * dt + spring_a[0] + pulley_a[0] + ((bodyType(body) == "kinematics1D-mass" || pulley)? Globals.gravity[0]: 0),
          y:state.acc.y * dt + spring_a[1] + pulley_a[1] + ((bodyType(body) == "kinematics1D-mass" || pulley)? Globals.gravity[1]: 0)};
}

/* 
  Custom integrator: On each iteration, updates velocity then position of each component
*/
Physics.integrator('principia-integrator', function( parent ){
  return {  
  // Velocity increases by acceleration * dt
  integrateVelocities: function( bodies, dt ){
    
    // Raise flag on all pulleys that they need to be solved
    for ( var i = 1, l = bodies.length; i < l; ++i ){
      var body = bodies[i];
      if(bodyType(body) == "kinematics1D-pulley")
        body2Constant(body).solve_tension = true;
    }

    // Loop through and adjust velocity for each body
    for ( var i = 1, l = bodies.length; i < l; ++i ){
      var body = bodies[i];
      var consts = body2Constant(body);
      var spring_a = applySpringForces(body);
      
      var state = body.state;
      state.old = cloneState(body.state);

      // Handle pulleys as its own closed system
      var pulley = getAttachedPulley(body);
      if(pulley){
        applyPulleyForces(body, dt);
      }
      else {
        // Otherwise compute new velocity using thrust, gravity, and any attached springs
        state.vel.x += state.acc.x * dt + spring_a[0];
        state.vel.y += state.acc.y * dt + spring_a[1];
        if(body.treatment == "dynamic"){
          state.vel.x += Globals.gravity[0] * dt;
          state.vel.y += Globals.gravity[1] * dt;
        }  
      }

      state.angular.vel += state.angular.acc;
    }
  },

  // Position increases by velocity * dt + 1/2 acceleration * dt**2
  integratePositions: function( bodies, dt ){
    for ( var i = 1, l = bodies.length; i < l; ++i ){
      var body = bodies[ i ];
      var state = body.state;
      var temp = cloneState(body.state);
      
      if(Globals.bodyConstants[i].attachedTo && Globals.bodyConstants[i].attachedTo.length > 0) {
        state.pos.x += state.vel.x;
        state.pos.y += state.vel.y;
        
        // Before saving state, may need to handle a pulley-bound object reaching the end
        var pulley = getAttachedPulley(body);
        if(pulley)
          handlePulleyStop(pulley, body);
      }
      
      else if (bodyType(body) == "kinematics1D-mass") {
        // Recall that this equation assumes constant acceleration! Not the case for springs!
        state.pos.x += state.old.vel.x * dt + (state.acc.x + Globals.gravity[0]) * 0.5 * dt*dt;
        state.pos.y += state.old.vel.y * dt + (state.acc.y + Globals.gravity[1]) * 0.5 * dt*dt;  
      }
      
      // Attached spring element must tag along
      if(body2Constant(body).attachedTo){
        for(var j=0; j < body2Constant(body).attachedTo.length; j++){
          var attachedTo = Globals.world.getBodies()[body2Constant(body).attachedTo[j]];
          if(body2Constant(attachedTo).ctype != "kinematics1D-pulley"){
            attachedTo.state.pos.x = state.pos.x;
            attachedTo.state.pos.y = state.pos.y;
          }
        }
      }
      
      state.angular.pos += state.angular.vel;
      state.old = temp;      
    }            
  }
};});
