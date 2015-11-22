// Global Variables:
var Globals = {
  world: {},
  states: [],
  frame: 0,
  delay: 10,
  anim: {},
  running: false,
  initStates: [],
  finalStaes: [],
  totalFrames: 4000,
  canvasId: "viewport",
  didMove: false,
  selectedBody: false
};

function onPropertyChanged(property, value){
	console.log(property + "," + value);
	
	var world = Globals.world;
	var body = Globals.selectedBody;	
	var initStates = Globals.initStates;
	
	switch(property)
	{		
		case 'posx':
			body.state.pos.x = value;
			initStates[world.getBodies().indexOf(body)].pos.x = body.state.pos.x;
			break;
		case 'posy':
			body.state.pos.y = value;
			initStates[world.getBodies().indexOf(body)].pos.y = body.state.pos.y;
			break;
		case 'velx':
			body.state.vel.x = value;
			initStates[world.getBodies().indexOf(body)].vel.x = body.state.vel.x;
			break;
		case 'vely':
			body.state.vel.y = value;
			initStates[world.getBodies().indexOf(body)].vel.y = body.state.vel.y;
			break;
		case 'accx':
			body.state.acc.x = value;
			initStates[world.getBodies().indexOf(body)].acc.x = body.state.acc.x;
			break;
		case 'accy':
			body.state.acc.y = value;
			initStates[world.getBodies().indexOf(body)].acc.y = body.state.acc.y;
			break;
	}
	
	
	
	simulate();
	drawSimulator(0);
}

/* Scrubs to selected frame */
function onRangeUpdate(){
  Globals.frame = $("#simulatorFrameRange").val();
  drawSimulator(Globals.frame);
}


/* Toggles the state of the simulator between running and paused */
function toggleSimulator() {
  var span = $("#playpause").children()[0];
  Globals.running = !Globals.running;
  if (Globals.running) {
    Globals.anim = setInterval(function() {
      drawLoop()
    }, Globals.delay);
    span.className = "glyphicon glyphicon-pause";
  } else {
    clearInterval(Globals.anim);
    span.className = "glyphicon glyphicon-play";
  }
}


function drawLoop() {
  if (Globals.frame >= Globals.totalFrames) {
    Globals.frame = 0;
  }

  $("#simulatorFrameRange").val(Globals.frame)
  drawSimulator(Globals.frame);
  Globals.frame++;
}


/* Draw the simulator at frame n */
function drawSimulator(n) {
	var world = Globals.world;
	var selectedBody = Globals.selectedBody;
	
	for (var i = 0; i < Globals.world.getBodies().length; i++) {
		world.getBodies()[i].state = Globals.states[i][n];
	}
	world.render();
	
	if(selectedBody){
		var state = selectedBody.state;
		$('#properties-position-x').val(state.pos.x);
		$('#properties-position-y').val(state.pos.y);
		$('#properties-velocity-x').val(state.vel.x);
		$('#properties-velocity-y').val(state.vel.y);
		$('#properties-acceleration-x').val(state.acc.x);
		$('#properties-acceleration-y').val(state.acc.y);
		
		var img = selectedBody.view;
		var halfw = img["width"]/2;
		var halfh = img["height"]/2;
		
		world.renderer().ctx.strokeStyle = '#ff0000';
		world.renderer().ctx.lineWidth = 2;
		
		world.renderer().ctx.strokeRect(state.pos.x-halfw, state.pos.y-halfh, halfw*2, halfh*2);						
		/*	
		world.renderer().ctx.translate((state.pos.x), (state.pos.y));
		world.renderer().ctx.rotate(45 * Math.PI/180);
		world.renderer().ctx.strokeRect(state.pos.x, state.pos.y, halfw*2, halfh*2);				
		world.renderer().ctx.rotate(-45 * Math.PI/180);
		world.renderer().ctx.translate(-(state.pos.x), -(state.pos.y));
		
		world.renderer().ctx.strokeStyle = '#00ff00';		
		world.renderer().ctx.rotate(-45 * Math.PI/180);
		world.renderer().ctx.strokeRect(0, 0	, halfw*2, halfh*2);				
		world.renderer().ctx.rotate(45 * Math.PI/180);
		*/
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


function simulate() {
  var i = 0;
  var j = 0;

  Globals.frame = 0;
  if (Globals.running) {
    toggleSimulator();
  }
  $("#simulatorFrameRange").val(0); // Reset range

  Globals.states = [];	// Clear states global
  //Globals.world._animTime = undefined;
  //Globals.world._lastTime = undefined; // Unnecessary?
  Globals.world._time = 0;

  var old = {
    pos: new Physics.vector(),
    vel: new Physics.vector(),
    acc: new Physics.vector(),
    angular: { pos: 0.0, vel: 0.0, acc: 0.0}
  };

  
  // Restore objects to their initial state
  for (i = 0; i < Globals.world.getBodies().length; i++) {
    Globals.world.getBodies()[i].state = cloneState(Globals.initStates[i]);
    Globals.world.getBodies()[i].state["old"] = cloneState(old);
    Globals.world.getBodies()[i]._started = undefined;
    Globals.states[i] = [];
  }
  
//Globals.world.step();	// Calling step once required for initialization?
  
  // For each frame
  for (i = 0; i < Globals.totalFrames; i++) {
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

  var data = {
    'type': type,
    'x': cx-vleft,
    'y': cy-vtop
  };

  Globals.world.emit('addComponent', data);
}

Physics.integrator('my-integrator', function( parent ){

    return {

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

        integratePositions: function( bodies, dt ){
			for ( var i = 0, l = bodies.length; i < l; ++i ){
                var body = bodies[ i ];
                var state = body.state;
				var temp = cloneState(body.state);
				state.pos.x += state.old.vel.x * dt + state.acc.x * 0.5 * dt*dt;
				state.pos.y += state.old.vel.y * dt + state.acc.y * 0.5 * dt*dt;
				state.angular.pos += state.angular.vel;
				state.old = temp;
				state.acc.zero();
				state.angular.acc = 0.0;
			}
            // update the positions of all bodies according to timestep dt
            // store the previous positions in .state.old.pos
            // and .state.old.angular.pos
            // also set the accelerations to zero
        }
    };
});

$(document).ready(function() {
  Kinematics1D.initModule();
  
  // Prepare event handling
  $('#properties-position-x').on("change", function(){ onPropertyChanged('posx', $('#properties-position-x').val()); }); 
  $('#properties-position-y').on("change", function(){ onPropertyChanged('posy', $('#properties-position-y').val()); }); 
  $('#properties-velocity-x').on("change", function(){ onPropertyChanged('velx', $('#properties-velocity-x').val()); }); 
  $('#properties-velocity-y').on("change", function(){ onPropertyChanged('vely', $('#properties-velocity-y').val()); }); 
  $('#properties-acceleration-x').on("change", function(){ onPropertyChanged('accx', $('#properties-acceleration-x').val()); }); 
  $('#properties-acceleration-y').on("change", function(){ onPropertyChanged('accy', $('#properties-acceleration-y').val()); }); 
});