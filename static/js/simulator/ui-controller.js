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

  var data = { 'x': cx-vleft, 'y': swapYpos(cy-vtop, false)};

  moveOrigin(data);  
  drawMaster();
}

// Event fired when user is done dragging component from toolbox
function handleDragStop(event, ui){  
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
  Globals.keyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? kIndex(Globals.frame): false;   
    
  // Highlight mini canvas
  highlightKeycanvas(Globals.keyframe, "yellow");

  drawMaster();
  updatePVAChart();
}

// Toggles the state of the simulator between running and paused
function toggleSimulator(){
  if(!Globals.timelineReady) return;
  var span = $("#playpause").children()[0];
  Globals.running = !Globals.running;
  
  // Set frame delay based on total number of delays.
  // TODO: Consider having the user specify this via global options
  Globals.delay = 25;
  
  if (Globals.running) {
    Globals.anim = setInterval(function() { drawLoop() }, Globals.delay);
    $("#play-pause-icon").removeClass("fa-play")
    $("#play-pause-icon").addClass("fa-pause")    
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

// Sets a boolean property to the specified value
function updateBooleanProperty(body, property, value){
  Globals.bodyConstants[bIndex(body)][property] = value;

  if (property === "vectors") {
    $(".vector-toggle").prop("checked", value)
  } else if (property === "vectors_ttt") {
    $(".ttt-toggle").prop("checked", value)
  } else if (property === "showGraph") {
    $(".pvagraph-toggle").prop("checked", value)
  }

  // Special case: Handle showing/hiding the graph div
  if(property === "showGraph"){
    var allHidden = (graphBodyIndices().length === 0);
    if(allHidden){ $("#pvaGraphContainer").hide(); }         
    else { $("#pvaGraphContainer").show(); updatePVAChart(); }
  }
  
  drawMaster();
}

// Handler for clicking a mini canvas and setting state to that keyframe
// n can either be a string containing a dash followed by the keyframe number or the number itself
function selectKeyframe(n){
	var frame = isNaN(n)? n.target.id.split("-")[1]: n;
	Globals.keyframe = parseInt(frame);  
  highlightKeycanvas(frame);
  
  if(Globals.timelineReady)
  {
    Globals.frame = Globals.keyframes[Globals.keyframe];
    $("#simulatorFrameRange").val(Globals.frame);
  }
  
  if(Globals.selectedBody !== false){  
    selectPropertyInputType(Globals.selectedBody, "posx");
    selectPropertyInputType(Globals.selectedBody, "posy");
    selectPropertyInputType(Globals.selectedBody, "velx");
    selectPropertyInputType(Globals.selectedBody, "vely");
    selectPropertyInputType(Globals.selectedBody, "accx");
    selectPropertyInputType(Globals.selectedBody, "accy");
  }

  assignAlpha();
  
  // Draw master will set state appropriately and display it
	drawMaster();
}

function assignAlpha(){
  // Handle assigning transparency to objects with unknown positions
  var frame = getKF();
  var variables = Globals.variableMap;
  for(var i=1; i < Globals.world.getBodies().length; i++){
    if(variables[frame][i].posx != "?" && variables[frame][i].posy != "?"){
      if(Globals.bodyConstants[i].alpha)
        delete Globals.bodyConstants[i].alpha;
    }
    else{
      Globals.bodyConstants[i].alpha = 0.5;  
    }
  }
}

function updateNickname(body, name){
  body2Constant(body).nickname = name;
  dirty();
  drawMaster();
}

// Wrapper for updating properties followed by immediate resimulate and redraw
function updatePropertyRedraw(body, property, value){

  // Special case for Polar coordinates
  if(Globals.coordinateSystem == "polar" && $.inArray(property, ["posx","posy","velx","vely","accx","accy"]) !== -1){
       
    // Convert from Polar input to Cartesian coordinate
    var point;
    
    if(property == "posx") {
      other = $('#general-properties-position-y').val();
      point = polar2Cartesian([value, other]);
    }
    else if(property == "posy") {      
      other = $('#general-properties-position-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    if(property == "velx") {
      other = $('#pointmass-properties-velocity-y').val();
      point = polar2Cartesian([value, other]);
    }
    else if(property == "vely") {
      value *= -1; // Un-invert y vel. value because it's really an angle (only y vel/acc are inverted in base.js)
      other = $('#pointmass-properties-velocity-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    if(property == "accx") {
      other = $('#pointmass-properties-acceleration-y').val();
      point = polar2Cartesian([value, other]);
    }
    else if(property == "accy") {
      value *= -1; // Un-invert y acc. value because it's really an angle (only y vel/acc are inverted in base.js)
      other = $('#pointmass-properties-acceleration-x').val();
      point = polar2Cartesian([other, value]);
    }
    var index = bIndex(body);
    // Convert back to default PhysicsJS origin, if a position was updated
    if(property.substring(0,3) == "pos")
      point = [origin2PhysicsScalar("x", point[0]), origin2PhysicsScalar("y", point[1])];
    
    point = [convertUnit(point[0], "posx", true), convertUnit(point[1], "posy", true)]
        
    
    // Update properties within simulator, draw, and return
    onPropertyChanged(index, property.substring(0,3) + "x", point[0]);
    
    if(point[1] === -0){
      point[1] = "?";
    }
    
    if(Globals.numKeyframes > 1 && point[1] == "?"){
      toggleUnknown(body, property.substring(0,3) + "y");
    }
    else {
      onPropertyChanged(index, property.substring(0,3) + "y", point[1]);
    }
    
    if(Globals.numKeyframes == 1) attemptSimulation();
    drawMaster();
    return;
  }

  // Convert back to default PhysicsJS origin, update properties, and draw
  if(property == "posx" || property == "posy")
    value = origin2PhysicsScalar(property.slice(-1), value);    
  value = convertUnit(value, property, true);
  onPropertyChanged(bIndex(body), property, value);
  
  if(Globals.numKeyframes == 1) attemptSimulation();  
  drawMaster();
}

function selectPropertyInputType(body, property){
  var index = bIndex(body);
  var type = isNaN(Globals.variableMap[getKF()][index][property])? "text": "number";
  var readonly = (type == "text");
  
  switch(property)
  {
    case "posx":
      $('#general-properties-position-x').attr("type", type); 
      $('#general-properties-position-x').prop("readonly", readonly);      
      break;
    case "posy":
      $('#general-properties-position-y').attr("type", type);
      $('#general-properties-position-y').prop("readonly", readonly);
      break;
    case "velx":
      $('#pointmass-properties-velocity-x').attr("type", type);
      $('#pointmass-properties-velocity-x').prop("readonly", readonly);
      break;
    case "vely":
      $('#pointmass-properties-velocity-y').attr("type", type);
      $('#pointmass-properties-velocity-y').prop("readonly", readonly);
      break;
    case "accx":
      $('#pointmass-properties-acceleration-x').attr("type", type);
      $('#pointmass-properties-acceleration-x').prop("readonly", readonly);
      break;
    case "accy":
      $('#pointmass-properties-acceleration-y').attr("type", type);
      $('#pointmass-properties-acceleration-y').prop("readonly", readonly);
      break;
  }
  
  if(readonly){
    if(property == "posx") $('#general-properties-position-x').val("Unknown");
    if(property == "posy") $('#general-properties-position-y').val("Unknown");
    if(property == "velx") $('#pointmass-properties-velocity-x').val("Unknown");
    if(property == "vely") $('#pointmass-properties-velocity-y').val("Unknown");
    if(property == "accx") $('#pointmass-properties-acceleration-x').val("Unknown");
    if(property == "accy") $('#pointmass-properties-acceleration-y').val("Unknown");  
  }
}

function toggleUnknown(body, property){
  if(Globals.keyframe === false) {
    var frame = lastKF();
    setStateKF(frame);
    Globals.keyframe = frame;
    highlightKeycanvas(Globals.keyframe);
  }
  var index = bIndex(body);
  if(isNaN(Globals.variableMap[Globals.keyframe][index][property])){
    onPropertyChanged(index, property, 0);
  }
  else{
    onPropertyChanged(index, property, Number.NaN);
  }
  
  selectPropertyInputType(body, property)
  
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
  
  if(Globals.running)
    toggleSimulator();
  
  $('#keyframe-list').append("<li> " +
                     " <div class='keyframe-tile'> " +
                      "  <div class='remove-keyframe-btn'> " +
                       "   <a class='btn-floating btn-small waves-effect waves-light red delete-kf-btn clickable' id='remove-keyframe-" + Globals.numKeyframes + "'><i class='fa fa-times'></i></a> " +
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
  
  if(Globals.numKeyframes == 2)
  {
    var variables = $("[principia-property]");
    for(var i=0; i<variables.length; i++)
    {
      var li = variables[i];
      $($(li).children()[0]).addClass("input-field-variable");
      $(li).append(
      "<div class=\"input-field-unknown-container\" title=\"Mark this value as unknown.\">" +
        "<a class=\"input-field-unknown btn green accent-1\"><img class=\"clickable responsive-img\" src=\"/static/img/toolbox/shrug.png\" width=\"30\"/></a>" +
      "</div>");
    }
    
    $('.input-field-unknown').on("click", function(event){
      var property = $(event.target).parents().eq(2).attr("principia-property");
      toggleUnknown(Globals.selectedBody, property);
    });
  }
}

function removeKeyframe(event){
  var eventFrame = event.target;  
  
  var index = parseInt(eventFrame.parentNode.id.split("-")[2]);
  
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
  
  if(Globals.numKeyframes == 1)
  {
    $(".input-field-variable").removeClass("input-field-variable");
    
    $('.input-field-unknown').off();
    
    var variables = $("[principia-property]");
    for(var i=0; i<variables.length; i++)
    {
      var li = variables[i];
      $(li).children()[1].remove();
    }
  }
  
  // Special case: User deletes currently selected keyframe
  if(index == Globals.keyframe){
    Globals.keyframe--;
    setStateKF(Globals.keyframe);
    highlightKeycanvas(Globals.keyframe);
    drawMaster();
  }
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
  if (Globals.selectedBody === false) {
    toggleMenuOff();
    return
  }

  // override normal context menu
  event.preventDefault();

  var canvas = document.getElementById("viewport");
  var body = Globals.selectedBody;
  var pos = getMousePos(canvas, event);
  var posx = pos.x;
  var posy = pos.y;

  if (bodyType(Globals.selectedBody) == "kinematics1D-mass") {
    $("#pointmass-properties-vector-cmenu").prop("checked", $("#pointmass-properties-vector")[0].checked);
    $("#pointmass-properties-vector-ttt-cmenu").prop("checked", $("#pointmass-properties-vector-ttt")[0].checked);
    $("#pointmass-properties-pvagraph-cmenu").prop("checked", $("#pointmass-properties-pvagraph")[0].checked);

    var img = body.view;
    var halfw = img["width"] / 2;
    var halfh = img["height"] / 2;

    // get click x and y
    // get body x and y
    // create square,  see if contextMenuclick is in square
    var loc = body.state.pos;
    var rectRight= loc.x + halfw;
    var rectBottom= loc.y + halfh;
    var rectx = loc.x - halfw;
    var recty = loc.y - halfh;

    // check each rect for hits
    // if this rect is hit, display an alert
    if (posx >= rectx && posx <= rectRight && posy >= recty && posy <= rectBottom) {
      // there is an object selected, show context menu:
      toggleMenuOn();
      positionMenu(event);
    } else {
      toggleMenuOff();
    }
  }
}

function clickListener(e) {
  var button = e.which || e.button;
  if ( button === 1 ) {
    toggleMenuOff();
  }
}

function panZoomUpdate(data) {
  var mouseX = data.x;
  var mouseY = data.y;
  var dx = mouseX - Globals.lastPos.x;
  var dy = mouseY - Globals.lastPos.y;
  
  var can = Globals.world.renderer();

  can.ctx.translate(dx, dy);  
  Globals.lastPos.x = mouseX;
  Globals.lastPos.y = mouseY;
  var trans = Globals.translation;
  trans.x += dx; trans.y += dy;
  can.ctx.clearRect(-trans.x, -trans.y, can.width+Math.abs(trans.x), can.height+Math.abs(trans.y));

  drawMaster();  
}

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

// updated positionMenu function
function positionMenu(e) {
  var clickCoords;
  var clickCoordsX;
  var clickCoordsY;
  var menuWidth;
  var menuHeight;
  var canvasWidth;
  var canvasHeight;
  var canvas = document.getElementById("viewport");
  clickCoords = getPosition(e);
  clickX = clickCoords.x;
  clickY = clickCoords.y;

  // Left and top of canvas window
  var vleft = $("#" + Globals.canvasId).position().left;
  var vtop = $("#" + Globals.canvasId).position().top;

  var data = { 'x': clickX-vleft, 'y': clickY-vtop};
  var x = data.x;
  var y = data.y;

  menuWidth = menu.offsetWidth + 4;
  menuHeight = menu.offsetHeight + 4;

  canvasWidth = canvas.clientWidth;
  canvasHeight = canvas.clientHeight;
  
  if ( (canvasWidth - x) < menuWidth ) {
    menu.style.left = canvasWidth - menuWidth + vleft + "px";
  } 
  else {
    menu.style.left = x + vleft + "px";
  }

  if ( (canvasHeight - y) < menuHeight ) {
    menu.style.top = canvasHeight - menuHeight + vtop  + "px";
  } 
  else {
    menu.style.top = y + vtop +"px";
  }
}

function populateOverview(e) {

  var bodies = Globals.world.getBodies();
  var consts = Globals.bodyConstants;
  var $list = $("#overview-list");

  $list.html("");

  for(var i = 1; i < bodies.length; i++)
  {
    var img;
    //img = bodies[i].view;
    switch(consts[i].ctype)
    {
      case "kinematics1D-mass":
        img = Globals.massImages[consts[i].img];
        break;
      case "kinematics1D-pulley":
        img = "/static/img/toolbox/pulley.png";
        break;
      case "kinematics1D-ramp":
        img = "/static/img/toolbox/ramp.png";
        break;
      case "kinematics1D-spring":
      case "kinematics1D-spring-child":
        img = "/static/img/toolbox/spring.png";
        break;
    }
     $list.append(
    "<li >" +
      "<div class ='row clickable'>"+
       "<div class = ' col s4' onclick = 'selectBody(" + i + ")'>"+
          "<img src='" + img + "' width='20' component='kinematics1D-mass'>"+
       "</div>"+
       "<div class = 'col s4' onclick = 'selectBody(" + i + ")'>"+
        consts[i].nickname +
       "</div>"+
       "<div class = 'col s4' onclick = 'deleteBody(" + i + ")'>"+
        "<i class='fa fa-trash' ></i>"+
       "</div>" +
      "<div>"+
    "</li>"
    );
  }
}

function deleteBody(bodyIndex){
  // If called without a parameter, get the index of the currently selected body
  if (bodyIndex === undefined) {
    bodyIndex = bIndex(Globals.selectedBody);
  }

  // Make sure there is a valid index selected to attempt to delete
  if (bodyIndex > -1) {
    // Get the body constants to delete and remove it from bodyConstants
    var bodToDelete = Globals.bodyConstants[bodyIndex];
    Globals.bodyConstants.splice(bodyIndex, 1);

    // Remove the body from all of the keyframes
    var len = Globals.keyframeStates.length;
    for (var i = 0; i < len; i++) {
      Globals.keyframeStates[i].splice(bodyIndex, 1);
    }

    // Remove the body from the physicsjs world and deselect it
    Globals.world.removeBody(Globals.world.getBodies()[bodyIndex]);
    Globals.selectedBody = false;
    toggleMenuOff(); // Hides any open context menus

    // Begin Spring and Pulley specific logic!

    // We already deleted one of the ends of the spring, but now we
    // have to delete the other end
    if (bodToDelete.ctype.indexOf("spring-child") !== -1) {
      // Delete the parent of the child spring that was just deleted from
      // bodyConstants, the keyframes, and the physicsjs world
      Globals.bodyConstants.splice(bodToDelete.parent, 1);
      for (i = 0; i < len; i++) {
        Globals.keyframeStates[i].splice(bodToDelete.parent, 1);
      }
      Globals.world.removeBody(Globals.world.getBodies()[bodToDelete.parent]);
    } else if (bodToDelete.ctype.indexOf("spring") !== -1) {
      // Delete the child of the parent spring that was just deleted from
      // bodyConstants, the keyframes, and the physicsjs world
      Globals.bodyConstants.splice(bodToDelete.child - 1, 1);
      for (i = 0; i < len; i++) {
        Globals.keyframeStates[i].splice(bodToDelete.child - 1, 1);
      }
      Globals.world.removeBody(Globals.world.getBodies()[bodToDelete.child - 1]);
    }

    // We need to update the indexes of referenced components in the list of all
    // of the remaining body constants. If the deleted body was a spring, we have
    // to decrement the referenced index by 2, otherwise we just decrement it by 1
    len = Globals.bodyConstants.length;
    var decSize = 1;
    if (bodToDelete.ctype.indexOf("spring") !== -1) {
      decSize = 2;
    }

    // We want to update the referring indices of all of the components after the
    // one that was deleted, unless it was a spring child, then we'll need to step
    // back a step since the child and previous parent will have been deleted
    var startIndex = bodyIndex;
    if (bodToDelete.ctype.indexOf("spring-child") !== -1) {
      startIndex--;
    }

    // Loop through all bodies after the deleted body to update any indices that
    // reference changed index
    for (i = startIndex; i < len; i++) {
      bod = Globals.bodyConstants[i];
      if (bod.ctype.indexOf("spring-child") !== -1) {
        bod.parent -= decSize;
      } else if (bod.ctype.indexOf("spring") !== -1) {
        bod.child -= decSize;
      }
    }

    // If the component deleted was a spring or pulley, we need to loop through
    // any of the existing components to check if any of them were attached to
    // the spring or pulley. If they were we need to delete the reference
    if (bodToDelete.ctype.indexOf("spring") !== -1 || bodToDelete.ctype.indexOf("pulley") !== -1) {
      // For Springs get the actual reference if it was
      // the parent or child spring node that was deleted
      var refToDelete = bodyIndex;
      if (bodToDelete.child !== undefined) {
        refToDelete = bodToDelete.child;
      }
      for (i = 0; i < len; i++) {
        bod = Globals.bodyConstants[i];
        if (bod.attachedTo !== undefined && bod.attachedTo === refToDelete) {
         delete bod.attachedTo;
        }
      }
    }

    // If the component deleted was a pointmass, we need to loop through all of the
    // remaining components (specifically any springs) to check to see if any of the
    // springs were attached to this pointmass. If they were we delete the reference
    if (bodToDelete.ctype.indexOf("mass") !== -1) {
      for (i = 0; i < len; i++) {
        bod = Globals.bodyConstants[i];
        if (bod.attachedBody !== undefined && bod.attachedBody === bodyIndex) {
         delete bod.attachedBody;
        }
        // For Pulleys
        if (bod.attachedBodyLeft !== undefined && bod.attachedBodyLeft === bodyIndex) {
         delete bod.attachedBodyLeft;
         bod.left_open = true;
        }
        if (bod.attachedBodyRight !== undefined && bod.attachedBodyRight === bodyIndex) {
         delete bod.attachedBodyRight;
         bod.right_open = true;
        }
      }
    }
    // End Spring and Pulley specific logic!

    simulate();
    drawMaster();
    updateKeyframes();
    populateOverview();
  }
}

function selectBody(bodyIndex){
  Globals.selectedBody = Globals.world.getBodies()[bodyIndex];
  
  selectPropertyInputType(Globals.selectedBody, "posx");
  selectPropertyInputType(Globals.selectedBody, "posy");
  selectPropertyInputType(Globals.selectedBody, "velx");
  selectPropertyInputType(Globals.selectedBody, "vely");
  selectPropertyInputType(Globals.selectedBody, "accx");
  selectPropertyInputType(Globals.selectedBody, "accy");
    
  if(bodyIndex !== 0) 
    $("#elementprops-tab").click();
  else
    $("#globalprops-tab").click();
    
  drawMaster();
}

function keyUp(e)
{
  var wasSet = (Globals.aDown || Globals.vDown);
  
  if (e.keyCode == 86) Globals.vDown = false;
  if (e.keyCode == 65) Globals.aDown = false;
  
  if(!Globals.vDown && !Globals.aDown){
    Globals.vChanging = false;
    if(Globals.numKeyframes == 1 && wasSet)
      attemptSimulation();
  }
}

function keyDown(e)
{
  if (e.keyCode == 86) Globals.vDown = true;
  if (e.keyCode == 65) Globals.aDown = true;
 
  if(Globals.vDown || Globals.aDown)
    Globals.vChanging = true;
}
