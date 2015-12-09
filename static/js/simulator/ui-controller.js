/*
  This file contains functions and event handlers for interacting with UI elements.
*/

// Defines drag event for draggable-classed components
$(".draggable").draggable({
	  cursor: 'move',
	  containment: $(Globals.canvasId),
	  scroll: false,
	  stop: handleDragStop,
	  helper: 'clone',
    appendTo: 'body'
});


// Event fired when user is done dragging component from toolbox
function handleDragStop(event, ui){
  if(!Globals.canAdd()) return;
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

// Scrubs to selected frame
function onRangeUpdate(){
  // Prevent use of timeline until simulation is complete
  if(!Globals.timelineReady){
    $("#simulatorFrameRange").val(0)
    return;
  }
  
  // Set new frame and draw it
  Globals.frame = parseInt($("#simulatorFrameRange").val());
  // Update keyframe variable if the selected frame is also a keyframe
  if(Globals.useKeyframes)
    Globals.keyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? Globals.frame: false;   
  drawMaster();  
}

// Toggles the state of the simulator between running and paused
function toggleSimulator() {
  if(!Globals.timelineReady) return;
  var span = $("#playpause").children()[0];
  Globals.running = !Globals.running;
  
  // Set frame delay based on total number of delays.
  // TODO: Consider having the user specify this via global options
  if(Globals.totalFrames <= 20) Globals.delay = 250;
  else if(Globals.totalFrames <= 50) Globals.delay = 100;
  else if(Globals.totalFrames <= 1000) Globals.delay = 25;
  else Globals.delay = 25;
  
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

function selectKeyframe(event) {
	var frame = event.target.id.split("-")[1];
	Globals.keyframe = parseInt(frame);
	drawMaster();
}

function toggleGlobalProp() {
  var propWin = $("#global-properties")[0].classList;
  if (propWin.contains("hide")) {
    propWin.remove("hide");
  } else {
    propWin.add("hide");
  }
}



// ToDo: Dynamically construct HTML properties window based on selected body
// Alternative: Massive properties window with every possible property, but selectively hidden/shown
function constructPropertiesWindow(body, doPos, doVel, doAcc, mixin){
  var html = "<h5 class=\"pad-sides\"><span id=\"properties-nickname-title\"></span>Properties</h5>";
  
  /*
  <div class="row">
      <div class="input-field col s6">
        <input type="number" id="properties-position-x" placeholder=""></input>
        <label for="properties-position-x">X Position</label>
      </div>
  */
  if(doPos){
    html += "<div class=\"row\">";
    html += "<div class=\"input-field col s6\">";
    html += "<input type=\"number\" id=\"properties-position-x\" placeholder=\"\"></input>";
    html += "<label for=\"properties-position-x\">X Position</label>";
    html += "</div>";
    
    html += "<div class=\"row\">";
    html += "<div class=\"input-field col s6\">";
    html += "<input type=\"number\" id=\"properties-position-y\" placeholder=\"\"></input>";
    html += "<label for=\"properties-position-y\">Y Position</label>";
    html += "</div>";
  }
  
  
  //for(var property in ...) {
   // propertyName is what you want
   // you can get the value like this: myObject[propertyName]
  //}
  
  if(mixin){ html += mixin;}
  
  return html;
}
