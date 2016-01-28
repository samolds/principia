/*
  ui-controller.js --
  This file contains functions and event handlers for interacting with UI elements.
*/

// Defines drag event for ui-draggable-classed components
$(".ui-draggable").draggable({
    cursor: 'move',
    containment: $(Globals.canvasId),
    scroll: false,
    stop: handleUIDragStop,
    helper: 'clone',
    appendTo: 'body'
});

// Defines drag event for draggable-classed components
$(".draggable").draggable({
	  cursor: 'move',
	  containment: $(Globals.canvasId),
	  scroll: false,
	  stop: handleDragStop,
	  helper: 'clone',
    appendTo: 'body'
});


// Event fired when user is done dragging component that is not part of PhysicJS world (origin target)
function handleUIDragStop(event, ui){
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

  var data = { 'x': cx-vleft, 'y': cy-vtop};

  console.log("Origin:" + data.x + ", " + data.y  );
  
  Globals.origin = [data.x, data.y];
  
  $("#glob-xorigin").val(data.x) ; 
  $("#glob-yorigin").val(data.y) ;
}

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

  resetSaveButton();
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
  
  // Highlight mini canvas
  if(Globals.keyframe === 0 || Globals.keyframe)
  {
    var frame = Globals.keyframe > 0? 1: 0; //TODO map frame to appropriate index
    $("#" + "keyframe-" + frame).attr("style","border:4px solid #0000cc");
  }
  else
  {
    $("#" + "keyframe-0").attr("style","");
    $("#" + "keyframe-1").attr("style","");
  }
  
  drawMaster();  
}

// Toggles the state of the simulator between running and paused
function toggleSimulator(){
  if(!Globals.timelineReady) return;
  var span = $("#playpause").children()[0];
  Globals.running = !Globals.running;
  
  // Set frame delay based on total number of delays.
  // TODO: Consider having the user specify this via global options
  if(Globals.totalFrames <= 20) Globals.delay = 25;
  else if(Globals.totalFrames <= 50) Globals.delay = 25;
  else if(Globals.totalFrames <= 1000) Globals.delay = 25;
  else Globals.delay = 25;
  
  if (Globals.running) {
    Globals.anim = setInterval(function() { drawLoop() }, Globals.delay);
    $("#play-pause-icon").removeClass("fa-play")
    $("#play-pause-icon").addClass("fa-pause")
    Globals.selectedKeyframe = false;
  } 
  else {
    clearInterval(Globals.anim);
    $("#play-pause-icon").removeClass("fa-pause")
    $("#play-pause-icon").addClass("fa-play")
    if(Globals.frame == 0){
      $("#keyframe-0").attr("style","border:4px solid #0000cc");
    }
    //from old version: assumes keyframe-1 is the last keyframe
    // TODO delete this when fully updated
    //if(Globals.frame == Globals.totalFrames){
      //$("#keyframe-1").attr("style","border:4px solid #0000cc");
    //}
  }
}

// Handler for clicking a mini canvas and setting state to that keyframe
function selectKeyframe(event){
	var frame = event.target.id.split("-")[1];
	Globals.keyframe = parseInt(frame);
  
  for(var i = 0; i<Globals.numKeyframes+1; i++)
  {
    //remove highlight
    $("#" + "keyframe-"+i).attr("style","");

  }
//add highlight
  $("#" + event.target.id).attr("style","border:4px solid #0000cc");
 
 //TODO: handle transparent for general case
  // if(frame == 0){
  //   for(var i=0; i<Globals.world.getBodies().length; i++)
  //     if(!isNaN(Globals.variableMap[i].x0) && !isNaN(Globals.variableMap[i].y0))
  //       delete Globals.bodyConstants[i].alpha;
  //     else
  //       Globals.bodyConstants[i].alpha = 0.5;
  // }
  // else{
  //   for(var i=0; i<Globals.world.getBodies().length; i++)
  //     if(!isNaN(Globals.variableMap[i].xf) && !isNaN(Globals.variableMap[i].yf))
  //       delete Globals.bodyConstants[i].alpha;
  //     else
  //       Globals.bodyConstants[i].alpha = 0.5;
  // }
   
  // Draw master will set state appropriately and display it
	drawMaster();
}

// TODO: Not being called anymore?
function toggleGlobalProp(){
  var propWin = $("#global-properties")[0].classList;
  if (propWin.contains("hide")) {
    propWin.remove("hide");    
  } else {
    propWin.add("hide");
  }
}

// Wrapper for updating properties followed by immediate resimulate and redraw
function updatePropertyRedraw(property, value){

  // Special case for Polar coordinates
  if(Globals.coordinateSystem == "polar"){
    
    // Convert from Polar input to Cartesian coordinate
    var point;
    if(property == "posx") {
      other = $('#properties-position-y').val();
      point = polar2Cartesian([value, other]);
    }
    else {
      other = $('#properties-position-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    // Convert back to default PhysicsJS origin
    point = [origin2PhysicsScalar("x", point[0]), origin2PhysicsScalar("y", point[1])];
    
    // Update properties within simulator, draw, and return
    onPropertyChanged("posx", point[0], false);
    onPropertyChanged("posy", point[1], true);
    drawMaster();
    return;
  }

  // Convert back to default PhysicsJS origin, update properties, and draw
  if(property == "posx" || property == "posy")
    value = origin2PhysicsScalar(property.slice(-1), value);    
  onPropertyChanged(property, value, true);
  drawMaster();
}

// function showRemoveKeyframeBtn(event){
//   $('.remove-keyframe-btn').style.visibility = "visible";
//   console.log("yo yo yo");
// }
// function hideRemoveKeyframeBtn(event){
//   $('.remove-keyframe-btn').style.visibility = "hidden";
//   console.log("yo yo yo");
// }

function updateCoords(coord_sys){
    Globals.coordinateSystem = coord_sys;
    if(coord_sys == "cartesian"){
      $('#x-position-label').html("X Position");
      $('#y-position-label').html("Y Position");
    }
    else if(coord_sys == "polar"){
      $('#x-position-label').html("r Position");
      $('#y-position-label').html("Θ Position");
    }
  }

function addKeyframe(){
  console.log("Added Keyframe");
if (Globals.numKeyframes == Globals.maxNumKeyframes)
{
  return;
}
  Globals.numKeyframes++;

  $('#keyframe-list').append("<li id='keyframe-li-" + Globals.numKeyframes +"> " +
                     " <div class='keyframe-tile'> " +
                      "  <div class='remove-keyframe-btn'> " +
                       "   <a class='btn-floating btn-small waves-effect waves-light red' id='remove-keyframe'><i class='fa fa-times'></i></a> " +
                      "  </div> " +
                       "   <h6>Frame " + Globals.numKeyframes + ": </h6> " +
                       "   <canvas id='keyframe-"+ Globals.numKeyframes +"' class='keyframe' ></canvas> " +
                     
                       " <div class='input-field'> " +
                       "       <input id='keyframe-"+ Globals.numKeyframes +"-dt' type='text' value='?'></input> " +
                       "       <label for='keyframe-"+ Globals.numKeyframes +"-dt' class='active'>dt</label> " +
                       " </div> " +
                      " </div> " +
                   " </li>");

 $('#keyframe-' + Globals.numKeyframes).on("click", function(event) { selectKeyframe(event); } );

}

function removeKeyframe(){
var frame = event.target;
console.log("FRAME:" +frame);
$(frame).parents().eq(3).remove();


}

function updateOrigin(coordinate, value){
  if(coordinate == "x"){
    Globals.origin[0] = value;
  }
  else {
    Globals.origin[1] = value;
  }
}
