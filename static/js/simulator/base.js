// Global Variables:
var Globals = {
  world: {},
  states: [],
  frame: 0,
  delay: 1,
  anim: {},
  running: false,
  initStates: [],
  totalFrames: 4000,
  canvasId: "viewport"
};


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

    document.getElementById("play-pause-icon").innerHTML ="pause";
   // span.className = "glyphicon glyphicon-pause";
  } else {
    clearInterval(Globals.anim);
    document.getElementById("play-pause-icon").innerHTML ="play_arrow";
  //  span.className = "glyphicon glyphicon-play";
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
  for (var i = 0; i < Globals.world.getBodies().length; i++) {
    Globals.world.getBodies()[i].state = Globals.states[i][n];
  }
  Globals.world.render();
}


function cloneState(state) {
  var acc = state.acc.clone();
  var vel = state.vel.clone();
  var pos = state.pos.clone();
  var ang = {
    "acc": state.angular.acc,
    "vel": state.angular.vel,
    "pos": state.angular.pos
  };

  var clone = {
    "acc": acc,
    "vel": vel,
    "pos": pos,
    "angular": ang
  };
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
  Globals.world._animTime = undefined;
  Globals.world._lastTime = undefined;
  Globals.world._time = 0;

  var old = {
    pos: new Physics.vector(),
    vel: new Physics.vector(),
    acc: new Physics.vector(),
    angular: {
      pos: 0.0,
      vel: 0.0,
      acc: 0.0
    }
  };

  Globals.world.step();	// Calling step once required for initialization?

  // Restore objects to their initial state
  for (i = 0; i < Globals.world.getBodies().length; i++) {
    Globals.world.getBodies()[i].state = cloneState(Globals.initStates[i]);
    Globals.world.getBodies()[i].state["old"] = cloneState(old);
    Globals.world.getBodies()[i]._started = undefined;
    Globals.states[i] = [];
  }

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


$(document).ready(function() {
  Kinematics1D.initModule();
});
