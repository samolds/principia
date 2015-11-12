// Global Variables:
var world;
var states;
var frame = 0;
var delay = 1;
var anim;
var running = false;
var initStates = [];

/* Scrubs to selected frame */
function onRangeUpdate(){
	frame = $("#simulatorFrameRange").val();
	drawSimulator(frame);
}

/*
Toggles the state of the simulator between running and paused
*/
function toggleSimulator(){
	var span = $("#playpause").children()[0];
	running = !running;
	if(running){
		anim = setInterval(function(){ drawLoop() },delay);
		span.className = "glyphicon glyphicon-pause";		
	}
	else {		
		clearInterval(anim);
		span.className = "glyphicon glyphicon-play";
	}
}

function drawLoop()
{
	if(frame >= 1000)
		frame = 0;
	
	$("#simulatorFrameRange").val(frame)
	
	drawSimulator(frame);
		
	frame++;
}


/*
Draw the simulator at frame n 
*/
function drawSimulator(n)
{
	for(var i=0; i<world.getBodies().length; i++)	
		world.getBodies()[i].state = states[i][n];
	
	world.render();	
}


function cloneState(state)
{
	var acc = state.acc.clone();
	var vel = state.vel.clone();
	var pos = state.pos.clone();
	var ang = {"acc": state.angular.acc,"vel": state.angular.vel,"pos": state.angular.pos};
	var clone = {"acc": acc,"vel": vel,"pos": pos,"angular": ang};
	return clone;
}

function simulate(){
	frame = 0;
	if(running) toggleSimulator();
	$("#simulatorFrameRange").val(0); // Reset range
	
	
	states = [];	// Clear states global
	world._animTime = undefined;
	world._lastTime = undefined;
	world._time = 0;

	var old = {pos: new Physics.vector(),vel: new Physics.vector(),acc: new Physics.vector(),angular: {pos: 0.0,vel: 0.0,acc: 0.0}};	
	world.step();	// Calling step once required for initialization?
	
	// Restore objects to their initial state
	for(var j=0; j<world.getBodies().length; j++){
		world.getBodies()[j].state = cloneState(initStates[j]);
		world.getBodies()[j].state["old"] = cloneState(old);
		world.getBodies()[j]._started = undefined;
	}
	
	// Every object gets its own sequence of states
	for(var j=0; j<world.getBodies().length; j++)
		states[j] = [];
	
	// For each body in the simulation
	// For each frame
	for(var i=0; i<1000; i++)
	{
		for(var j=0; j<world.getBodies().length; j++)
		{	
			// Clone the state information for the current body
			var curState = world.getBodies()[j].state;
			var saveState = cloneState(curState);
			if(i != 0) saveState["old"] = states[j][i-1];
			// Save state information and advance the simulator
			states[j].push(saveState);
		}
		world.step();
	}
}


$(".draggable").draggable({
    cursor: 'move',
    containment: $("viewport"),
	scroll: false,
	stop: handleDragStop,
    helper: 'clone'
});

function handleDragStop(event, ui)
{  	      
	var type = ui.helper[0].getAttribute("component");
	
	// Left and top of helper img
	var left = ui.offset.left;
	var top = ui.offset.top;		
	
	var width = event.target.width;
	var height = event.target.height;
	
	var cx = left + width/2;
	var cy = top + height/2;
	
	// Left and top of viewport
	var vleft = $("#viewport").position().left;
	var vtop = $("#viewport").position().top;
	
	console.log(left + " " + top) 	
	
	var data = {'type':type,'x':cx-vleft,'y':cy-vtop};
	
	world.emit('addComponent', data);
}


$( document ).ready(function() {
	Kinematics1D.initModule();    
});