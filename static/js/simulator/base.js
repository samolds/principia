// Global Variables:
var world;
var states;
var frame = 0;
var delay = 1;
var anim;
var running = false;

function updateRange()
{
	frame = $("#simulatorFrameRange").val();	
	drawSimulator(frame);
}


function toggleSimulator()
{
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

function drawSimulator(i)
{
	for(var j=0; j<world.getBodies().length; j++)
		world.getBodies()[j].state = states[j][i];
	world.render();	
}

function simulate(){
	states = [];	// Clear states global
	world.step();	// Calling step once required for initialization?
	
	// For each body in the simulation
	for(var j=0; j<world.getBodies().length; j++)
	{
		// Create a new state object
		states[j] = [];
		
		// For each frame
		for(var i=0; i<1000; i++)
		{
			// Clone the state information for the current body
			var curState = world.getBodies()[j].state;
			var acc = curState.acc.clone();
			var vel = curState.vel.clone();
			var pos = curState.pos.clone();
			var ang = {"acc": curState.angular.acc,"vel": curState.angular.vel,"pos": curState.angular.pos};
			var saveState = {"acc": acc,"vel": vel,"pos": pos,"angular": ang};
			
			// Save state information and advance the simulator
			states[j].push(saveState);
			world.step();
		}
	}
}

function allowDrop(ev) { ev.preventDefault();}

function drag(ev){ 
	ev.dataTransfer.setData("id", ev.target.id);	
	ev.dataTransfer.setData("x", ev.clientX);	
	ev.dataTransfer.setData("y", ev.clientY);	
}

function drop(ev){	
	ev.preventDefault();
	var canvas = $( "canvas:first" );
	var position = canvas.position();
	var data = {'id':ev.dataTransfer.getData("id"),
				'x':ev.dataTransfer.getData("x") - position.left,
				'y':ev.dataTransfer.getData("y")};
	
	console.log(data.x);
	console.log(data.y);
		
	world.emit('addComponent', data);
	
	//console.log(ev.clientX - position.left); //NOTE: this works at 100% scale, but clientX changes based on zoom
};

/*
$(".draggable").draggable({
	drag: function( event, ui ) { console.log("a ha ha ha");}
});

$(".droppable").droppable({
    scope: "items",
    drop: function (event, ui) {
        console.log("I am droppable");
    }
});
*/