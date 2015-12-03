// Global Variables:
var Globals = {
  
  // Current PhysicJS world
  world: {},  
  
  // Currently selected frame in range
  frame: 0,
  
  // Controls speed of frame change while animating
  delay: 250,
  
  // Interval event that allows for animation
  anim: {},
  
  // Flag indicating that the timeline is ready for a user to play/pause/scrub
  timelineReady: false,
 
  // Flag for when simulator is currently running
  running: false,
    
  // Saved information for scrubbing through simulation
  // states[0] will always match initStates
  states: [],
  
  // State at each keyframe (One inner array per keyframe)
  keyframeStates: [[],[]],
  
  // Time associated with each keyframe (false if unknown)
  keyframeTimes: [0, false],
  
  // Index of key frames within states (false if not associated with "real" frame yet)
  keyframes: [0, false],
  
  // Currently selected keyframe or false (no edit)
  selectedKeyframe: 0,
  
  // Maximum number of frames to try before giving up on solver
  totalFrames: 4000,
  
  // Id associated with canvas element used for rendering
  canvasId: "viewport",
  
  // If a move event is fired after a grab event, raise flag to inform release event
  didMove: false,
  
  didAddMultiComponent: false,
  
  // Currently selected body, false if none
  selectedBody: false,
  
  // Variables associated with each body:
  // Each body has:
  // x0, xf, v0, vf, a (for kinematics, need to update later with y values plus other unknowns?)
  variableMap: [],
  
  // Equation solver for currently loaded module
  // Current approach: Using js-solver library, which uses eval function and map of variables to equations that can be used to solve them
  // Generate frames when there are no unknowns left, gives up if an iteration doesn't update any variables
  solver: false,
  
  globAccel: false,
};

function updateVariable(body, variable, value){
	var variableMap = Globals.variableMap;
	var i = Globals.world.getBodies().indexOf(body);
	value = parseFloat(value);
	if(isNaN(value)) value = "?";
	if(Globals.selectedKeyframe == 0){
		if(variable == "posx") variableMap[i]["x0"] = value;
		if(variable == "velx") variableMap[i]["v0"] = value;
	}
	else {
		if(variable == "posx") variableMap[i]["xf"] = value;
		if(variable == "velx") variableMap[i]["vf"] = value;
	}
	
	if(variable == "accx") variableMap[i]["a"] = value;
}

function onPropertyChanged(property, value){
	if(!canEdit()) return;
	console.log(property + "," + value);
	
	var world = Globals.world;
	var body = Globals.selectedBody;	
	var kStates = Globals.keyframeStates[Globals.selectedKeyframe];
	
  var floatVal = parseFloat(value);
	switch(property)
	{		
		case 'posx':
			if(value != '?') body.state.pos.x = floatVal;
			kStates[world.getBodies().indexOf(body)].pos.x = body.state.pos.x;
			updateVariable(body, property, value);
			break;
		case 'posy':
			if(value != '?') body.state.pos.y = floatVal;
			kStates[world.getBodies().indexOf(body)].pos.y = body.state.pos.y;			
			break;
		case 'velx':
			if(value != '?') body.state.vel.x = floatVal;
			kStates[world.getBodies().indexOf(body)].vel.x = body.state.vel.x;
			updateVariable(body, property, value);
			break;
		case 'vely':
			if(value != '?') body.state.vel.y = floatVal;
			kStates[world.getBodies().indexOf(body)].vel.y = body.state.vel.y;			
			break;
		case 'accx':
			if(value != '?') body.state.acc.x = floatVal;
			kStates[world.getBodies().indexOf(body)].acc.x = body.state.acc.x;
			updateVariable(body, property, value);
			break;
		case 'accy':
			if(value != '?') body.state.acc.y = floatVal;
			kStates[world.getBodies().indexOf(body)].acc.y = body.state.acc.y;
			break;
    case 'mass':
      body.mass = floatVal;
      kStates[world.getBodies().indexOf(body)].mass = body.mass;
      break;
    case 'nickname':
      body.nickname = value;
      kStates[world.getBodies().indexOf(body)].nickname = body.nickname;
      break;
    case 'glob-xaccel':
      Globals.globAccel._acc.x = floatVal;
      break;
    case 'glob-yaccel':
      Globals.globAccel._acc.y = floatVal;
      break;
	}

	drawKeyframe(Globals.selectedKeyframe);
}

/* Scrubs to selected frame */
function onRangeUpdate(){
  // Prevent use of timeline until simulation is complete
  if(!Globals.timelineReady){
	$("#simulatorFrameRange").val(0)
	return;
  }
  
  Globals.frame = $("#simulatorFrameRange").val();
  Globals.selectedKeyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? Globals.frame: false;
  drawSimulator(Globals.frame);
}

/* Toggles the state of the simulator between running and paused */
function toggleSimulator() {
  if(!Globals.timelineReady) return;
  var span = $("#playpause").children()[0];
  Globals.running = !Globals.running;
  if (Globals.running) {
    Globals.anim = setInterval(function() { drawLoop() }, Globals.delay);
    document.getElementById("play-pause-icon").innerHTML ="pause";   
	Globals.selectedKeyframe = false;
  } 
  else {
    clearInterval(Globals.anim);
    document.getElementById("play-pause-icon").innerHTML ="play_arrow";
  }
}

function drawLoop() {
  // Reset to beginning after reaching final frame
  if (Globals.frame > Globals.totalFrames) { Globals.frame = 0;}

  // Update range
  $("#simulatorFrameRange").val(Globals.frame)
  
  // Draw simulation at current frame
  drawSimulator(Globals.frame);
  
  // Increment frame counter
  Globals.frame++;
}

function displayElementValuesKF(body) {
  var variables = Globals.variableMap[Globals.world.getBodies().indexOf(body)];
  displayElementValues(body);

  if (variables && body) {
    if (Globals.selectedKeyframe == 0) {
      $('#properties-position-x').val(variables["x0"]);
      $('#properties-velocity-x').val(variables["v0"]);
      $('#properties-acceleration-x').val(variables["a"]);
    } else {
      $('#properties-position-x').val(variables["xf"]);
      $('#properties-velocity-x').val(variables["vf"]);
      $('#properties-acceleration-x').val(variables["a"]);
    }
  }
}

/* Shows elements values in html elements */
function displayElementValues(bod) {
  if (bod) {
    var st = bod.state;
    $('#properties-position-x').val(st.pos.x);
    $('#properties-position-y').val(st.pos.y);
    $('#properties-velocity-x').val(st.vel.x);
    $('#properties-velocity-y').val(st.vel.y);
    $('#properties-acceleration-x').val(st.acc.x);
    $('#properties-acceleration-y').val(st.acc.y);
    $('#properties-mass').val(bod.mass);
    $('#properties-nickname').val(bod.nickname);
    if (bod.nickname) {
      $('#properties-nickname-title').text(bod.nickname + " ");
    } else {
      $('#properties-nickname-title').text("");
    }
  } else {
    $('#properties-position-x').val("");
    $('#properties-position-y').val("");
    $('#properties-velocity-x').val("");
    $('#properties-velocity-y').val("");
    $('#properties-acceleration-x').val("");
    $('#properties-acceleration-y').val("");
    $('#properties-mass').val("");
    $('#properties-name').val("");
    $('#properties-nickname-title').text("");
  }
}


function toggleGlobalProp() {
  var propWin = $("#global-properties")[0].classList;
  if (propWin.contains("hide")) {
    propWin.remove("hide");
  } else {
    propWin.add("hide");
  }
}


function renderWorld() {
  Globals.world.render();
  var propWin = $("#properties")[0].classList;
  if (Globals.selectedBody) {
    propWin.remove("hide");
  } else if (!propWin.contains("hide")) {
    propWin.add("hide");
  }
}

/* Draws highlight box around selected element */
function highlightSelection(body) {
  var img = body.view;
  var halfw = img["width"] / 2;
  var halfh = img["height"] / 2;
  var canvas = Globals.world.renderer();

  canvas.ctx.strokeStyle = '#ff0000';
  canvas.ctx.lineWidth = 2;

  renderWorld();
  var loc = body.state.pos;
  canvas.ctx.strokeRect(loc.x-halfw, loc.y-halfh, halfw*2, halfh*2);						

  /*	
  canvas.ctx.translate((loc.x), (loc.y));
  canvas.ctx.rotate(45 * Math.PI/180);
  canvas.ctx.strokeRect(loc.x, loc.y, halfw*2, halfh*2);				
  canvas.ctx.rotate(-45 * Math.PI/180);
  canvas.ctx.translate(-(loc.x), -(loc.y));

  canvas.ctx.strokeStyle = '#00ff00';		
  canvas.ctx.rotate(-45 * Math.PI/180);
  canvas.ctx.strokeRect(0, 0	, halfw*2, halfh*2);				
  canvas.ctx.rotate(45 * Math.PI/180);
  */
}

/* Draw the simulator at frame n */
function drawSimulator(n) {
	if(Globals.states.length == 0) return;
	var world = Globals.world;
	var selectedBody = Globals.selectedBody;
	
	for (var i = 0; i < Globals.world.getBodies().length; i++) {
		world.getBodies()[i].state = Globals.states[i][n];
	}

  renderWorld();
  displayElementValues(selectedBody);
  if (selectedBody) {
    highlightSelection(selectedBody);
  }
}

/* Draw the state at keyframe n */
function drawKeyframe(n) {
	var world = Globals.world;
	var selectedBody = Globals.selectedBody;
	var bodies = Globals.world.getBodies();
	// Set state of the world to match keyframe
  if (bodies.length > 0) {
    for (var i = 0; i < bodies.length; i++) {
      bodies[i].state = Globals.keyframeStates[n][i];
    }
  }
	
	// Render PhysicsJS components
	renderWorld();
		
	// Copy global canvas into canvas for keyframe
	var canvas = $('#' + Globals.canvasId)[0].children[0];  
	var keycanvas = $("#keyframe-" + n)[0];
	keycanvas.getContext('2d').clearRect(0, 0, keycanvas.width, keycanvas.height);
	keycanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, keycanvas.width, keycanvas.height);
	
	// Post-processing for global canvas and properties
	displayElementValuesKF(selectedBody);	
	drawLines();
	if (selectedBody) { highlightSelection(selectedBody);}
}

function drawLines(){		
	var bodies = Globals.world.getBodies();
	for (var i = 0; i < bodies.length; i++) {
		if(bodies[i].parent){
			drawLine(bodies[i].parent, bodies[i]);
		}
	}
}

function drawLine(b1, b2){	
	var canvas = Globals.world.renderer();
	var ctx = canvas.ctx;
	
	ctx.strokeStyle = '#aaaaaa'; // Gray
	ctx.lineWidth = 3;
	
	var x1 = b1.state.pos.x; var y1 = b1.state.pos.y;
	var x2 = b2.state.pos.x; var y2 = b2.state.pos.y;
	
	var xmin = x1 < x2? x1: x2;
	var xmax = x1 > x2? x1: x2;
	
	var ys = (x1 == xmin)? y1:y2;
	var ye = (x1 == xmin)? y2:y1;
	
	var x = xmin;
	var y =  ys;	
	var m = (ye-ys)/(xmax-xmin);
	// Handle vertical lines here too
	
	ctx.beginPath();
	ctx.moveTo(x,y);
	
	var wavelength, amplitude;
	var dx = xmax-xmin;
	
	// Need to play with these values (only affects appearance)
	if(dx > 300)      { wavelength = 0.25; amplitude = 4; }
	else if(dx > 250) { wavelength = 0.5;   amplitude = 8; }
	else if(dx > 200) { wavelength = 1; amplitude = 12; }
	else if(dx > 150) { wavelength = 1.25;   amplitude = 14; }
	else              { wavelength = 1.5; amplitude = 20; }
		
	var counter = 0;
	var incr = 10;
	for(; x<=xmax; x+=incr){
		ctx.lineTo(x,y);		
		ctx.stroke();
		y += (m*incr) + Math.sin(wavelength*counter)*amplitude; // Draws straight line perturbed in y by sine wave. Perturb in x too for better appearance?
		counter++;
	}
}

function cloneState(state) {
  var acc = state.acc.clone();
  var vel = state.vel.clone();
  var pos = state.pos.clone();
  var ang = {"acc": state.angular.acc, "vel": state.angular.vel, "pos": state.angular.pos};
  var clone = {"acc": acc, "vel": vel, "pos": pos, "angular": ang};
  return clone;
}

function attemptSimulation(){
	var solver = Globals.solver;
	var keyframeStates = Globals.keyframeStates;
	
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
	Globals.variableMap[0] = results;
	
	// TODO: Check if the results are sound and all variables are known
	// TODO: Update display of keyframe images to match results
	
	if(!Globals.keyframeTimes[1]){
		Globals.keyframeTimes[1] = results["t"];
		Globals.totalFrames = results["t"]/Globals.world.timestep();
	}
	$('#keyframe-1-dt').val(Globals.keyframeTimes[1]);
	$('#simulatorFrameRange')[0].max = Globals.totalFrames;
	
	// Modify bodies within keyframes to match results	
	keyframeStates[0][0]["pos"]["x"] = results["x0"];
	keyframeStates[0][0]["vel"]["x"] = results["v0"];
	keyframeStates[0][0]["acc"]["x"] = results["a"];
	
	keyframeStates[1][0]["pos"]["x"] = results["xf"];
	keyframeStates[1][0]["vel"]["x"] = results["vf"];
	keyframeStates[1][0]["acc"]["x"] = results["a"];

	// Draw keyframes in reverse order to update all the mini-canvases and so that we end up at t=0
	drawKeyframe(1);
	drawKeyframe(0);
	
	// Run the simulation using the solved keyframes
	simulate();
	
	// If results are sound, the user can play the simulation
	Globals.timelineReady = true;
}

function simulate() {
  var i = 0;
  var j = 0;

  Globals.frame = 0;
  if (Globals.running) {
    toggleSimulator();
  }
  $("#simulatorFrameRange").val(0); // Reset range

  Globals.states = [];	// Clear states global
  Globals.world._time = 0;

  var old = {
    pos: new Physics.vector(),
    vel: new Physics.vector(),
    acc: new Physics.vector(),
    angular: { pos: 0.0, vel: 0.0, acc: 0.0}
  };

  // Restore objects to their initial state
  var initStates = Globals.keyframeStates[0];
  for (i = 0; i < Globals.world.getBodies().length; i++) {
    Globals.world.getBodies()[i].state = cloneState(initStates[i]);
    Globals.world.getBodies()[i].state["old"] = cloneState(old);
    Globals.world.getBodies()[i]._started = undefined;
    Globals.states[i] = [];
  }
  // For each frame
  for (i = 0; i < Globals.totalFrames+1; i++) { // Simulate one extra frame to account for init state
    // For each body in the simulation
    for (j = 0; j < Globals.world.getBodies().length; j++) {
      // Clone the state information for the current body
      var curState = Globals.world.getBodies()[j].state;
      var saveState = cloneState(curState);

      // Save state information and advance the simulator
      if (i != 0) saveState["old"] = Globals.states[j][i-1]; {
        Globals.states[j].push(saveState);
      }
    }
    Globals.world.step();
  }
}

$(".draggable").draggable({
	  cursor: 'move',
	  containment: $(Globals.canvasId),
	  scroll: false,
	  stop: handleDragStop,
	  helper: 'clone'
});

function handleDragStop(event, ui) {
  if(!canAdd()) return;
  var type = ui.helper[0].getAttribute("component");

  // Left and top of helper img
  var left = ui.offset.left;
  var top = ui.offset.top;
  
  var width = event.target.width;
  var height = event.target.height;
  var cx = left + width / 2;
  var cy = top + height / 2;

  // Left and top of canvas window
  var vleft = $("#" + Globals.canvasId).position().left;
  var vtop = $("#" + Globals.canvasId).position().top;

  var data = { 'type': type, 'x': cx-vleft, 'y': cy-vtop};

  Globals.world.emit('addComponent', data);
}

function canEdit() { return (Globals.selectedKeyframe || Globals.selectedKeyframe === 0) && !Globals.didAddMultiComponent; }
function canAdd() { return  Globals.selectedKeyframe === 0 && !Globals.didAddMultiComponent; }

Physics.integrator('my-integrator', function( parent ){

    return {

		// Velocity increases by acceleration * dt
        integrateVelocities: function( bodies, dt ){
			for ( var i = 0, l = bodies.length; i < l; ++i ){

                var body = bodies[i];
                var state = body.state;	
				state.old = cloneState(body.state);
				state.vel.x += state.acc.x * dt;
				state.vel.y += state.acc.y * dt;
				state.angular.vel += state.angular.acc;
			}
            // update the velocities of all bodies according to timestep dt
            // store previous velocities in .state.old.vel
            // and .state.old.angular.vel
        },

		// Position increases by velocity * dt + 1/2 acceleration * dt**2
        integratePositions: function( bodies, dt ){
			for ( var i = 0, l = bodies.length; i < l; ++i ){
                var body = bodies[ i ];
                var state = body.state;
				var temp = cloneState(body.state);
				state.pos.x += state.old.vel.x * dt + state.acc.x * 0.5 * dt*dt;
				state.pos.y += state.old.vel.y * dt + state.acc.y * 0.5 * dt*dt;
				state.angular.pos += state.angular.vel;
				state.old = temp;
				//state.acc.zero();
				//state.angular.acc = 0.0;
			}
            // update the positions of all bodies according to timestep dt
            // store the previous positions in .state.old.pos
            // and .state.old.angular.pos
            // also set the accelerations to zero - NOT doing this now, why is this supposed to be required in the first place?
        }
    };
});

function selectKeyframe(event) {
	var frame = event.target.id.split("-")[1];
	Globals.selectedKeyframe = parseInt(frame);
	drawKeyframe(frame);
}
	
$(document).ready(function() {
  Kinematics1D.initModule();

  // Prepare event handling
  $('#properties-position-x').on("change", function(){ onPropertyChanged('posx', $('#properties-position-x').val()); }); 
  $('#properties-position-y').on("change", function(){ onPropertyChanged('posy', $('#properties-position-y').val()); }); 
  $('#properties-velocity-x').on("change", function(){ onPropertyChanged('velx', $('#properties-velocity-x').val()); }); 
  $('#properties-velocity-y').on("change", function(){ onPropertyChanged('vely', $('#properties-velocity-y').val()); }); 
  $('#properties-acceleration-x').on("change", function(){ onPropertyChanged('accx', $('#properties-acceleration-x').val()); }); 
  $('#properties-acceleration-y').on("change", function(){ onPropertyChanged('accy', $('#properties-acceleration-y').val()); });
  
  $('#properties-mass').on("change", function(){ onPropertyChanged('mass', $('#properties-mass').val()); }); 
  $('#properties-nickname').on("change", function(){ onPropertyChanged('nickname', $('#properties-nickname').val()); }); 
  
  $('#solve-btn').on('click', function() { attemptSimulation(); });
  
  // MUST name keyframe divs using this format (splits on -)
  $('#keyframe-0').on("click", function(event) { selectKeyframe(event); } );
  $('#keyframe-1').on("click", function(event) { selectKeyframe(event); } );
  
  $('#keyframe-1-dt').on("change", function(){ Globals.keyframeTimes[1] = $('#keyframe-1-dt').val(); });

  $('#glob-xaccel').val(Globals.globAccel._acc.x);
  $('#glob-yaccel').val(Globals.globAccel._acc.y);
  
  $('#glob-xaccel').on("change", function(){ onPropertyChanged('glob-xaccel', $('#glob-xaccel').val()); }); 
  $('#glob-yaccel').on("change", function(){ onPropertyChanged('glob-yaccel', $('#glob-yaccel').val()); }); 
});
