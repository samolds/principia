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

  var world = Globals.world;
  var bodies = world.getBodies();
  var delta = Globals.delta;
    
  // Attach the origin to a body if within delta pixels
  var detach = true;
  for(var j=0; j<bodies.length; j++){
    var body = bodies[j];
    if(distance(body.state.pos.x, body.state.pos.y, data.x, data.y) <= delta){
      detach = false;
      Globals.originObject = j;
      
      // Update data to point to object position
      data.x = body.state.pos.x;
      data.y = body.state.pos.y;
    }
  }
  
  if(detach && (Globals.originObject === 0 || Globals.originObject))  
    Globals.originObject = false;
    
  Globals.origin = [data.x, data.y];  
  $("#glob-xorigin").val(data.x) ; 
  $("#glob-yorigin").val(data.y) ;
  
  drawMaster();
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
    Globals.keyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? kIndex(Globals.frame): false;   
  
  // Highlight mini canvas
  if(Globals.keyframe === 0 || Globals.keyframe)
  {    
    $("#" + "keyframe-" + Globals.keyframe).attr("style","border:4px solid #0000cc");
  }
  else
  {
    for(var i=0; i < Globals.numKeyframes; i++){
      $("#" + "keyframe-" + i).attr("style","");
    }    
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
  
  for(var i = 0; i<Globals.numKeyframes; i++)
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
    else if(property == "posy") {
      other = $('#properties-position-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    if(property == "velx") {
      other = $('#properties-velocity-y').val();
      point = polar2Cartesian([value, other]);
    }
    else if(property == "vely") {
      other = $('#properties-velocity-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    if(property == "accx") {
      other = $('#properties-acceleration-y').val();
      point = polar2Cartesian([value, other]);
    }
    else if(property == "accy") {
      other = $('#properties-acceleration-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    // Convert back to default PhysicsJS origin, if a position was updated
    if(property.substring(0,3) == "pos")
      point = [origin2PhysicsScalar("x", point[0]), origin2PhysicsScalar("y", point[1])];
    
    point = [convertUnit(point[0], "posx", true), convertUnit(point[1], "posy", true)]
    
    // Update properties within simulator, draw, and return
    onPropertyChanged(property.substring(0,3) + "x", point[0], false);
    
    if(point[1] === -0)
      point[1] = "?";
    
    onPropertyChanged(property.substring(0,3) + "y", point[1], true);
    drawMaster();
    return;
  }

  // Convert back to default PhysicsJS origin, update properties, and draw
  if(property == "posx" || property == "posy")
    value = origin2PhysicsScalar(property.slice(-1), value);    
  value = convertUnit(value, property, true);
  onPropertyChanged(property, value, true);
  drawMaster();
}

// Update the coordinate system to 'polar' or 'cartesian'
function updateCoords(coord_sys){
    Globals.coordinateSystem = coord_sys;
    if(coord_sys == "cartesian"){
      $('#x-position-label').html("X Position");
      $('#y-position-label').html("Y Position");
      $('#x-velocity-label').html("X Velocity");
      $('#y-velocity-label').html("Y Velocity");
      $('#x-acceleration-label').html("X Acceleration");
      $('#y-acceleration-label').html("Y Acceleration");
    }
    else if(coord_sys == "polar"){
      $('#x-position-label').html("r Position");
      $('#y-position-label').html("Θ Position");
      $('#x-velocity-label').html("r Velocity");
      $('#y-velocity-label').html("Θ Velocity");
      $('#x-acceleration-label').html("r Acceleration");
      $('#y-acceleration-label').html("Θ Acceleration");
    }
    
    // Redraw (forces update of displayed values)
    drawMaster();
  }

// Adds a new keyframe, up to the limit
function addKeyframe(){
  
  if (Globals.numKeyframes == Globals.maxNumKeyframes)
    return;
  
  $('#keyframe-list').append("<li> " +
                     " <div class='keyframe-tile'> " +
                      "  <div class='remove-keyframe-btn'> " +
                       "   <a class='btn-floating btn-small waves-effect waves-light red delete-kf-btn' id='remove-keyframe-" + Globals.numKeyframes + "'><i class='fa fa-times'></i></a> " +
                      "  </div> " +
                       "   <h6>Frame " + (Globals.numKeyframes+1) + ": </h6> " +
                       "   <canvas id='keyframe-"+ (Globals.numKeyframes) +"' class='keyframe' ></canvas> " +
                     
                       " <div class='input-field'> " +
                       "       <input id='keyframe-"+ (Globals.numKeyframes) +"-dt' type='text' value='?'></input> " +
                       "       <label for='keyframe-"+ (Globals.numKeyframes) +"-dt' class='active'>dt</label> " +
                       " </div> " +
                      " </div> " +
                   " </li>");

  $('#keyframe-' + (Globals.numKeyframes)).on("click", function(event) { selectKeyframe(event); } );
  $('#remove-keyframe-' + (Globals.numKeyframes)).on("click", function(event) { removeKeyframe(event); } );
  
  pushDuplicates();   
  Globals.numKeyframes++;
}

function removeKeyframe(event){
  var eventFrame = event.target;  
  
  var index = parseInt(eventFrame.parentNode.id.split("-")[2]) - 1;
  
  // Shift keyframe times, states, indices, variableMap
  Globals.variableMap.splice(index, 1);
  Globals.keyframeStates.splice(index, 1);
  Globals.keyframes.splice(index, 1);
  Globals.keyframeTimes.splice(index, 1);
  
  var keyframeTiles = $(".keyframe-tile");
  
  for(var i=index+1; i<keyframeTiles.length; i++)
  {
    var keyframeTile = keyframeTiles[i];
    keyframeTile.childNodes[1].childNodes[1].id = "remove-keyframe-" + (i-1);
    keyframeTile.childNodes[3].innerHTML = "Frame " + (i) + ": ";
    keyframeTile.childNodes[5].id = "keyframe-" + (i-1);
    
    keyframeTile.childNodes[7].childNodes[1].id = "keyframe-" + (i-1) + "-dt";
    keyframeTile.childNodes[7].childNodes[3].setAttribute("for", "keyframe-" + (i-1) + "-dt");
  }
  
  $(eventFrame).parents().eq(3).remove();
  Globals.numKeyframes--;
  
  // Special case: User deletes currently selected keyframe
  if(index == Globals.keyframe){
    // select Globals.keyframe -1
  }
}

function updateOrigin(coordinate, value){
  if(coordinate == "x")
    Globals.origin[0] = value;
  else 
    Globals.origin[1] = value;
  
  // Redraw (forces update of displayed values)
  drawMaster();
}

function updateLengthUnit(factor){
  Globals.lengthFactor = parseFloat(factor);
  
  // Redraw (forces update of displayed values)
  drawMaster();
}

function updateTimeUnit(factor){
  Globals.timeFactor = parseFloat(factor);
  
  // Redraw (forces update of displayed values)
  drawMaster();
}

// (function() {

//   "use strict";

//   var taskItems = document.querySelectorAll(".task");

//   for(var j=0; j<bodies.length; j++){
//     var body = bodies[j];
//     contextMenuListener(body)
//     }
//   }


//   function contextMenuListener(el) {
//     el.addEventListener( "contextmenu", function(e) {
//       console.log(e, el);
//     });
//   }

// })();

var menu = document.querySelector(".context-menu");
var menuState = 0;
var activeClassName = "context-menu--active";

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };

}

function toggleMenuOn() {
  if ( menuState !== 1 ) {
    menuState = 1;
    menu.classList.add(active);
  }
}

function toggleMenuOff() {
  if ( menuState !== 0 ) {
    menuState = 0;
    menu.classList.remove(activeClassName);
  }
}



function contextMenuListener(event) {
    
console.log("hello");

  if(Globals.selectedBody)
  {

    var canvas = document.getElementById("viewport");
    var body = Globals.selectedBody;  
    var pos = getMousePos(canvas, event);
    var posx = pos.x;
    var posy = pos.y;
    //override normal context menu
    event.preventDefault();

    var img = body.view;
    var halfw = img["width"] / 2;
    var halfh = img["height"] / 2;

    //get click x and y
    //get body x and y
    //create square,  see if contextMenuclick is in square
    //
    var loc = body.state.pos;
    var rectRight= loc.x + halfw;
    var rectBottom= loc.y + halfh;
    var rectx = loc.x - halfw;
    var recty = loc.y - halfh; 

    // check each rect for hits
    console.log("rectx: " + rectx);
    console.log("recty: " + recty);
    console.log("rectBottom: " + rectBottom);
    console.log("rectRight: " + rectRight);

    // if this rect is hit, display an alert
    if(posx>=rectx && posx<=rectRight && posy>=recty && posy<=rectBottom  )
      {//there is an object selected show context menu:
        toggleMenuOn();  
        positionMenu(event);
      }
    else
    {
        toggleMenuOff();
    }
  }
  else
    {
        toggleMenuOff();
    }
}


function contextListener() {
  document.addEventListener( "contextmenu", function(e) {
    if ( contextMenuListener( e) ) {
      e.preventDefault();
      toggleMenuOn();
    } else {
      toggleMenuOff();
    }
  });
}

function clickListener(e) 
{
  
    var button = e.which || e.button;
    if ( button === 1 ) 
    {
      toggleMenuOff();
    }

}

// var menuPosition;
// var menuPositionX;
// var menuPositionY;

function getPosition(e) {
  var posx = 0;
  var posy = 0;

  if (!e) var e = window.event;

  if (e.pageX || e.pageY) {
    posx = e.pageX;
    posy = e.pageY;
  } else if (e.clientX || e.clientY) {
    posx = e.clientX + document.body.scrollLeft + 
                       document.documentElement.scrollLeft;
    posy = e.clientY + document.body.scrollTop + 
                       document.documentElement.scrollTop;
  }

  return {
    x: posx,
    y: posy
  }
}

// function positionMenu(e) {
//   menuPosition = getPosition(e);
//   menuPositionX = menuPosition.x + "px";
//   menuPositionY = menuPosition.y + "px";

//   menu.style.left = menuPositionX;
//   menu.style.top = menuPositionY;
// }



  var menuPosition;
 var menuPositionX;
 var menuPositionY;
var clickCoords;
var clickCoordsX;
var clickCoordsY;
  var menuWidth;
var menuHeight;
var canvasWidth;
var canvasHeight;

// updated positionMenu function
function positionMenu(e) {


var canvas = document.getElementById("viewport");

  clickCoords = getPosition(e);
  clickCoordsX = clickCoords.x;
  clickCoordsY = clickCoords.y;

  menuWidth = menu.offsetWidth + 4;
  menuHeight = menu.offsetHeight + 4;

  canvasWidth = canvas.clientWidth;
  canvasHeight = canvas.clientHeight;

  console.log("clickCoords: " + clickCoords );
  console.log("clickCoordsX: " + clickCoordsX );
  console.log("clickCoordsY: " + clickCoordsY );
  console.log("menuWidth: " + menuWidth );
  console.log("menuHeight: " + menuHeight );
  console.log("canvasWidth: " + canvasWidth );
  console.log("canvasHeight: " + canvasHeight );



  if ( (canvasWidth - clickCoordsX) < menuWidth ) {
    menu.style.left = canvasWidth - menuWidth + "px";
  } else {
    menu.style.left = clickCoordsX + "px";
  }

  if ( (canvasHeight - clickCoordsY) < menuHeight ) {
    menu.style.top = canvasHeight  + "px";
  } else {
    menu.style.top = clickCoordsY + "px";
  }
}

