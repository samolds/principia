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
    appendTo: 'body',
    zIndex: 20,
});

// Defines drag event for draggable-classed components
$(".draggable").draggable({
	  cursor: 'move',
	  containment: $(Globals.canvasId),
	  scroll: false,
	  stop: handleDragStop,
	  helper: 'clone',
    appendTo: 'body',
    zIndex: 20,
});

/* 
  Event fired when user is done dragging component that is not part of PhysicJS world (origin target)
*/
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

  moveOrigin(data, true);  
  drawMaster();
}

/* 
  Event fired when user is done dragging component from toolbox
*/
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
  
  var data = { 'type': type, 'x': Math.round(cx-vleft), 'y': Math.round(cy-vtop)};

  Globals.world.emit('addComponent', data);

  dirty();
}

/*
  Redisplays the time counter above the range
*/
function updateRangeLabel() { 
  var dt = Globals.world.timestep(); // dt value is property of world
  
  // For final time: Use either dt * the frame index, or an analytically solved keyframe time
  var ft = (Globals.keyframes.indexOf(Globals.totalFrames) != -1)? 
                                                Globals.keyframeTimes[kIndex(Globals.totalFrames)].toPrecision(4) :
                                                                     (dt*Globals.totalFrames - dt).toPrecision(4) ;
  
  // For current time: As above, use either dt * the frame index, or an analytically solved keyframe time
  if(Globals.keyframes.indexOf(Globals.frame) != -1)
    $('#play-range-label').html(
      (Globals.keyframeTimes[Globals.keyframe]).toPrecision(4) + "/"+ ft  + " (s)"
    ); 
  else
    $('#play-range-label').html(
      (dt*(Globals.frame? Globals.frame: 0)).toPrecision(4) + "/"+ ft + " (s)"
    ); 
}

/* 
  Scrubs to selected frame
*/
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
    
  updateRangeLabel();
    
  // Highlight mini canvas
  highlightKeycanvas(Globals.keyframe, "yellow");

  drawMaster();
  updatePVAChart();
}

/*
  Toggles the state of the simulator between running and paused
*/
function toggleSimulator(){
  if(!Globals.timelineReady) return;
  var span = $("#playpause").children()[0];
  Globals.running = !Globals.running;
  
  // Set frame delay for a default animation speed  
  Globals.delay = 25;
  
  if (Globals.running) { // Toggle off
    Globals.anim = setInterval(function() { drawLoop() }, Globals.delay);
    $("#play-pause-icon").removeClass("fa-play")
    $("#play-pause-icon").removeClass("play-pad")
    $("#play-pause-icon").addClass("fa-pause") 
    $("#play-pause-icon").addClass("pause-pad")   
  } 
  else { // Toggle on
    clearInterval(Globals.anim);
    $("#play-pause-icon").removeClass("fa-pause")
    $("#play-pause-icon").removeClass("pause-pad")
    $("#play-pause-icon").addClass("fa-play")
    $("#play-pause-icon").addClass("play-pad")
    if(Globals.frame == 0){
      $("#keyframe-0").attr("style","border:4px solid #0000cc");
    }

  }
}

/* 
  Sets a boolean property to the specified value 
*/
function updateBooleanProperty(body, property, value){
  Globals.bodyConstants[bIndex(body)][property] = value;

  // Three primary boolean properties are permitted to be updated:
  // Displaying vectors, tip-to-tail-vectors, and graphs
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
    if (!allHidden) {
      $('.pva-graph-no-graph-text').hide()
      $('#positionGraph').show()
      $('#vaGraph').show()
      updatePVAChart();
    } else {
      $('.pva-graph-no-graph-text').show()
      $('#positionGraph').hide()
      $('#vaGraph').hide()
    }
  }

   // Redraw
  drawMaster();
}

/*
  Handler for clicking a mini canvas and setting state to that keyframe
  n can either be a string containing a dash followed by the keyframe number or the number itself
*/
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

/*
  Handle assigning transparency to objects with unknown positions
  Also removes transparency is an object has known positions
*/
function assignAlpha(){
  
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

/*
  Updates the nickname of the specified body
*/
function updateNickname(body, name){
  body2Constant(body).nickname = name;
  dirty();
  drawMaster();
}

/* 
  Wrapper for updating properties followed by immediate resimulate and redraw 
*/
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
      other = $('#pointmass-properties-velocity-x').val();
      point = polar2Cartesian([other, value]);
    }
    
    if(property == "accx") {
      other = $('#pointmass-properties-acceleration-y').val();
      point = polar2Cartesian([value, other]);
    }
    else if(property == "accy") {      
      other = $('#pointmass-properties-acceleration-x').val();
      point = polar2Cartesian([other, value]);
    }
    var index = bIndex(body);
    // Convert back to default PhysicsJS origin, if a position was updated
    if(property.substring(0,3) == "pos")
      point = [origin2PhysicsScalar("x", point[0]), origin2PhysicsScalar("y", point[1])];
    
    point = [convertUnit(point[0], "posx", true), convertUnit(point[1], "posy", true)]
        
    
    // Update properties within simulator, draw, and return
    onPropertyChanged(index, property.substring(0,3) + "x", point[0], false);
    
    if(property.length >= 4 && property.substring(3) === "x" && property != "posx"){
      point[1] = "?";
    }
    
    if(Globals.numKeyframes > 1 && point[1] == "?"){
      toggleUnknown(body, property.substring(0,3) + "y");
    }
    else {
      onPropertyChanged(index, property.substring(0,3) + "y", point[1], false);
    }
    
    if(Globals.numKeyframes == 1) attemptSimulation();
    drawMaster();
    return;
  }

  // Convert back to default PhysicsJS origin, update properties, and draw
  if(property == "posx" || property == "posy")
    value = origin2PhysicsScalar(property.slice(-1), value);    
  value = convertUnit(value, property, true);
  
  // Master clamping location
  if(property == "mass")            value = clamp(0.1,value,1000);
  if(property == "surfaceWidth")    value = clamp(1,value,100000);
  if(property == "surfaceHeight")   value = clamp(1,value,100000);
  if(property == "surfaceFriction") value = clamp(0,value,1);
  if(property == "rampWidth")       value = clamp(1,value,50000);
  if(property == "rampHeight")      value = clamp(1,value,50000);
  if(property == "rampAngle")       value = clamp(10,value,80);
  if(property == "rampFriction")    value = clamp(0,value,1);
  if(property == "k")               value = clamp(0.001,value,0.05);
  
  var index = bIndex(body);
  if(property == "k" && bodyType(body) === "kinematics1D-spring-child")
    index = body2Constant(body).parent;
  
  onPropertyChanged(index, property, value, false);
  
  if(Globals.numKeyframes == 1) attemptSimulation();  
  drawMaster();
}

/*
  Swaps HTML inputs between text/number based on whether they contain "unknown" (variables) or a value
*/
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

/*
  Changes the specified body's specified property to the opposite of its current state (known/unknown)
*/
function toggleUnknown(body, property){
  
  // Unknowns must be toggled within a keyframe
  if(Globals.keyframe === false) {
    var frame = lastKF();
    setStateKF(frame);
    Globals.keyframe = frame;
    highlightKeycanvas(Globals.keyframe);
  }
  
  // Swap between NaN to indicate unknown or 0 to indicate a known value that can be modified
  var index = bIndex(body);
  if(isNaN(Globals.variableMap[Globals.keyframe][index][property])){
    onPropertyChanged(index, property, 0, false);
  }
  else{
    onPropertyChanged(index, property, Number.NaN, false);
  }
  
  // Adjust the HTML input type to match
  selectPropertyInputType(body, property)
  
  // Redraw the frame
  drawMaster();
}

/* 
  Update the coordinate system to 'polar' or 'cartesian' 
*/
function updateCoords(coord_sys){
    Globals.coordinateSystem = coord_sys;
    
    // Swap HTML display
    if(coord_sys == "cartesian"){
      $('#x-position-label').html("X Position");
      $('#y-position-label').html("Y Position");
      $('#x-velocity-label').html("X Velocity");
      $('#y-velocity-label').html("Y Velocity");
      $('#x-acceleration-label').html("X Thrust");
      $('#y-acceleration-label').html("Y Thrust");
    }
    else if(coord_sys == "polar"){
      $('#x-position-label').html("r Position");
      $('#y-position-label').html("Θ Position");
      $('#x-velocity-label').html("r Velocity");
      $('#y-velocity-label').html("Θ Velocity");
      $('#x-acceleration-label').html("r Thrust");
      $('#y-acceleration-label').html("Θ Thrust");
    }
    
    // Redraw (forces update of displayed values)
    drawMaster();
  }

/* 
  Handler for adding a new keyframe, up to the limit
*/
function addKeyframe(){
  
  // Don't allow multiple keyframes if the user reaches the limit
  if (Globals.numKeyframes == Globals.maxNumKeyframes){
    failToast("You have the maximum number of keyframes.");
    return;
  }
  
  // Don't allow multiple keyframes if there is a restricted component
  if(containsRestricted()){
    failToast("You must only use point mass components to utilize multiple keyframes.");
    return;
  }
  
  if(Globals.running)
    toggleSimulator();
  
  // Append a new keyframe-tile div along with the mini-canvas and time input
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

  // Register events for the newly added keyframe
  $('#keyframe-' + (Globals.numKeyframes)).on("click", function(event) { selectKeyframe(event); } );
  $('#remove-keyframe-' + (Globals.numKeyframes)).on("click", function(event) { removeKeyframe(event); } );
    
  // Copy bodies into new keyframe
  pushDuplicates();
  
  // Increment keyframe counter
  Globals.numKeyframes++;
  
  // If multiple keyframes just became available, add an input to mark unknowns to valid fields
  if(Globals.numKeyframes == 2)
  {
    var variables = $("[data-principia-property]");
    for(var i=0; i<variables.length; i++)
    {
      var li = variables[i];
      $($(li).children()[0]).addClass("input-field-variable");
      $(li).append(
      "<div class=\"input-field-unknown-container\" title=\"Mark this value as unknown.\">" +
        "<a class=\"input-field-unknown btn accent-1\"><img class=\"clickable responsive-img\" src=\"/static/img/toolbox/shrug.png\" width=\"30\"/></a>" +
      "</div>");
    }
    
    // Register event for new input
    $('.input-field-unknown').on("click", function(event){
      var property = $(event.target).parents().eq(2).attr("data-principia-property");
      toggleUnknown(Globals.selectedBody, property);
    });
    
    // Disable components that don't work with multiple keyframes
    colorToolbox(false);
  }
}

/*
  Handler for clicking the delete keyframe button
*/
function removeKeyframe(event){
  var eventFrame = event.target;  
  
  var index = parseInt(eventFrame.parentNode.id.split("-")[2]);
  
  // Shift keyframe times, states, indices, variableMap
  Globals.variableMap.splice(index, 1);
  Globals.keyframeStates.splice(index, 1);
  Globals.keyframes.splice(index, 1);
  Globals.keyframeTimes.splice(index, 1);
  
  var keyframeTiles = $(".keyframe-tile");
  
  // Reassign indices of each keyframe tile
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
  
  // Returned to sandbox mode:
  if(Globals.numKeyframes == 1)
  {
    // Disable input and event handler for adding variables
    $(".input-field-variable").removeClass("input-field-variable");    
    $('.input-field-unknown').off();
    
    var variables = $("[data-principia-property]");
    for(var i=0; i<variables.length; i++)
    {
      var li = variables[i];
      $(li).children()[1].remove();
    }
    
    // Re-enable restricted components
    colorToolbox(true);
  }
  
  // Special case: User deletes currently selected keyframe
  if(index == Globals.keyframe){
    Globals.keyframe--;
    setStateKF(Globals.keyframe);
    highlightKeycanvas(Globals.keyframe);
    drawMaster();
  }
}

/*
  Updates the length factor
*/
function updateLengthUnit(factor){
  Globals.lengthFactor = parseFloat(factor);
  
  // Redraw (forces update of displayed values)
  drawMaster();
}

/*
  Updates the time factor
*/
function updateTimeUnit(factor){
  Globals.timeFactor = parseFloat(factor);
  
  // Redraw (forces update of displayed values)
  drawMaster();
}

var menu = document.querySelector(".context-menu");
var menuState = 0;
var activeClassName = "context-menu--active";

/*
  Gets a mouse position relative to the canvas
*/
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}

/*
  Enables the context menu
*/
function toggleMenuOn() {
  if ( menuState !== 1 ) {
    menuState = 1;
    menu.classList.add(active);
  }
}

/*
  Disables the context menu
*/
function toggleMenuOff() {
  if ( menuState !== 0 ) {
    menuState = 0;
    menu.classList.remove(activeClassName);
  }
}

/*
  Event handler for a custom context menu
*/
function contextMenuListener(event) {
  if (Globals.selectedBody === false) {
    toggleMenuOff();
    return;
  }

  // Override normal context menu
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
    var rectRight= loc.x + Globals.translation.x + halfw;
    var rectBottom= loc.y + Globals.translation.y + halfh;
    var rectx = loc.x + Globals.translation.x - halfw;
    var recty = loc.y + Globals.translation.y - halfh;

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

/*
  Handler that removes context menu after a standard click
*/
function clickListener(e) {
  var button = e.which || e.button;
  if ( button === 1 ) {
    toggleMenuOff();
  }
}

/*
  Toggles the menu off when clicking outside the canvas
*/
function bodyClickListener(e) {
  var id = e.target.id;
  if (id === 'simulation-name' || id === 'simulation-description'
      || id === 'comments-frag' || id === 'comment-contents') {
    toggleMenuOff();
    Globals.selectedBody = false;
    drawMaster();
  }
}

/*
  Handles panning the camera and keeping track of the resulting
  global translation
*/
function panZoomUpdate(data) {
  
  var bodies = Globals.world.getBodies();
  var mouseX = data.x;
  var mouseY = data.y;
  
  // Find the difference of mouse positions
  var dx = mouseX - Globals.lastPos.x;
  var dy = mouseY - Globals.lastPos.y;
  
  var can = Globals.world.renderer();

  // Store the current mouse position for the next update
  Globals.lastPos.x = mouseX;
  Globals.lastPos.y = mouseY;
  
  // Accumulate global translation
  var trans = Globals.translation;  
  trans.x += dx; 
  trans.y += dy;
  
  // Redraw the frame
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

/* 
  Selects and centers the camera on the body with the specified index
*/
function centerBody(i){  
  selectBody(i);
  var bodies = Globals.world.getBodies();
  
  // Find the coordinates that would center the body
  var x = -Globals.selectedBody.state.pos.x + Globals.world.renderer().width/2;
  var y = swapYpos(Globals.selectedBody.state.pos.y, false) - Globals.world.renderer().height/2;
  
  // Translate the camera to those coordintates and draw the frame
  Globals.translation.x = x;
  Globals.translation.y = y;
  drawMaster();
}

/*
  Populates the overview tab with entries
*/
function populateOverview(e) {

  var bodies = Globals.world.getBodies();
  var consts = Globals.bodyConstants;
  
  // Clear the current overview
  var $list = $("#overview-list");
  $list.html("");

  // For each (non-origin) body:
  for(var i = 1; i < bodies.length; i++)
  {
    // Find an appropriate image
    var img;    
    switch(consts[i].ctype)
    {
      case "kinematics1D-mass":
        img = Globals.massImages[consts[i].img];
        break;
      case "kinematics1D-pulley":
        img = "/static/img/toolbox/pulley.png";
        break;
      case "kinematics1D-surface":
        img = "/static/img/toolbox/surface.png";
        break;
      case "kinematics1D-ramp":
        img = "/static/img/toolbox/ramp.png";
        break;
      case "kinematics1D-spring":
      case "kinematics1D-spring-child":
        img = "/static/img/toolbox/spring.png";
        break;
    }
    
    // Add a matching li with the image, nickname, and delete button to the overview
     $list.append(
    "<li >" +
      "<div class ='row clickable'>"+
       "<div class = ' col s4' onclick = 'centerBody(" + i + ")'>"+
          "<img src='" + img + "' width='20' component='kinematics1D-mass'>"+
       "</div>"+
       "<div class = 'col s4' onclick = 'centerBody(" + i + ");'>"+
        escapeHtml(consts[i].nickname) +
       "</div>"+
       "<div class = 'col s4' onclick = 'deleteBody(" + i + ")'>"+
        "<i class='fa fa-trash' ></i>"+
       "</div>" +
      "<div>"+
    "</li>"
    );
  }
}

/*
  Deletes the body with the specified index from the world
*/
function deleteBody(bodyIndex){
  // If called without a parameter, get the index of the currently selected body
  if (bodyIndex === undefined) {
    bodyIndex = bIndex(Globals.selectedBody);
  }

  // Make sure there is a valid index selected to attempt to delete
  if (bodyIndex > -1) {
    // Update the origin if the body was the origin object
    if (bodyIndex === Globals.originObject) {
      Globals.originObject = false;
      Globals.world.getBodies()[0].hidden = false;
    }

    // Get the body constants to delete and remove it from bodyConstants
    var bodToDelete = Globals.bodyConstants[bodyIndex];
    Globals.bodyConstants.splice(bodyIndex, 1);

    var deletedBodWasMass = bodToDelete.ctype.indexOf("mass") !== -1;
    var deletedBodWasSpringChild = bodToDelete.ctype.indexOf("spring-child") !== -1;
    var deletedBodWasSpring = bodToDelete.ctype.indexOf("spring") !== -1;
    var deletedBodWasPulley = bodToDelete.ctype.indexOf("pulley") !== -1;
    var deletedBodWasRamp = bodToDelete.ctype.indexOf("ramp") !== -1;
    var deletedBodWasSurface = bodToDelete.ctype.indexOf("surface") !== -1;

    // Remove the body from all of the keyframes
    var len = Globals.keyframeStates.length;
    for (var i = 0; i < len; i++) {
      Globals.keyframeStates[i].splice(bodyIndex, 1);
      Globals.variableMap[i].splice(bodyIndex, 1);
    }

    // Remove the body from the physicsjs world and deselect it
    Globals.world.removeBody(Globals.world.getBodies()[bodyIndex]);
    Globals.selectedBody = false;
    toggleMenuOff(); // Hides any open context menus
    if ($("#elementprops-tab").hasClass("active-side-menu-item"))
      rightSlideMenuClose();

    // Begin Spring and Pulley specific logic!

    // We already deleted one of the ends of the spring, but now we
    // have to delete the other end
    if (deletedBodWasSpringChild) {
      // Delete the parent of the child spring that was just deleted from
      // bodyConstants, the keyframes, and the physicsjs world
      Globals.bodyConstants.splice(bodToDelete.parent, 1);
      for (i = 0; i < len; i++) {
        Globals.keyframeStates[i].splice(bodToDelete.parent, 1);
      }
      Globals.world.removeBody(Globals.world.getBodies()[bodToDelete.parent]);
    } else if (deletedBodWasSpring) {
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
    if (deletedBodWasSpring) {
      decSize = 2;
    }

    // We want to update the referring indices of all of the components after the
    // one that was deleted, unless it was a spring child, then we'll need to step
    // back a step since the child and previous parent will have been deleted
    var startIndex = bodyIndex;
    if (deletedBodWasSpringChild) {
      startIndex--;
    }

    // Loop through all bodies after the deleted body to update any indices that
    // reference changed index
    for (i = 0; i < len; i++) {
      bod = Globals.bodyConstants[i];
      if (bod.ctype.indexOf("spring-child") !== -1) {
        if (i >= startIndex)
          bod.parent -= decSize;
        if (bod.attachedBody !== null && bod.attachedBody >= startIndex)
          bod.attachedBody -= decSize;
      } else if (i >= startIndex && bod.ctype.indexOf("spring") !== -1) {
        bod.child -= decSize;
      } else if (bod.ctype.indexOf("mass") !== -1) {
        if (deletedBodWasSpring || deletedBodWasSpringChild) {
          var refToDelete = bodyIndex;
          if (bodToDelete.child !== undefined) {
            refToDelete = bodToDelete.child;
          }
          var removedAttachmentIndex = bod.attachedTo.indexOf(refToDelete);
          if (removedAttachmentIndex !== -1) {
            bod.attachedTo.splice(removedAttachmentIndex, removedAttachmentIndex + 1);
          }
        }
        for (var j = 0; j < bod.attachedTo.length; j++) {
          if (bod.attachedTo[j] >= startIndex)
            bod.attachedTo[j] -= decSize;
        }
      }
    }

    // If the component deleted was a spring or pulley, we need to loop through
    // any of the existing components to check if any of them were attached to
    // the spring or pulley. If they were we need to delete the reference
    if (deletedBodWasSpring || deletedBodWasSpringChild || deletedBodWasPulley) {
      // For Springs get the actual reference if it was
      // the parent or child spring node that was deleted
      var refToDelete = bodyIndex;
      if (bodToDelete.child !== undefined) {
        refToDelete = bodToDelete.child;
      }
      for (i = 0; i < len; i++) {
        bod = Globals.bodyConstants[i];
        if (bod.ctype.indexOf("mass") !== -1) {
          if(bod.side) delete bod.side;
          refIndex = bod.attachedTo.indexOf(refToDelete)
          if (refIndex !== -1) {
            bod.attachedTo.splice(refIndex, refIndex + 1)
          }
        }
      }
    }

    // If the component deleted was a pointmass, we need to loop through all of the
    // remaining components (specifically any springs) to check to see if any of the
    // springs were attached to this pointmass. If they were we delete the reference
    if (deletedBodWasMass) {
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

/*
  Selects the body with the specified index
*/
function selectBody(bodyIndex){
  Globals.selectedBody = Globals.world.getBodies()[bodyIndex];
  
  // Update HTML element input types based on status of each variable
  selectPropertyInputType(Globals.selectedBody, "posx");
  selectPropertyInputType(Globals.selectedBody, "posy");
  selectPropertyInputType(Globals.selectedBody, "velx");
  selectPropertyInputType(Globals.selectedBody, "vely");
  selectPropertyInputType(Globals.selectedBody, "accx");
  selectPropertyInputType(Globals.selectedBody, "accy");

  if(body2Constant(Globals.selectedBody).massType == "square"){
    $("#mass-square-img").show();
    $("#mass-round-img").hide();
  }
  
  if(body2Constant(Globals.selectedBody).massType == "round"){
    $("#mass-square-img").hide();
    $("#mass-round-img").show();
  }
  
   
  // Open the globals tab (origin was selected) or the properties tab (some other body was selected)
  if (bodyIndex === 0 && !$("#globalprops-tab").hasClass("active-side-menu-item"))
    $("#globalprops-tab").click();
  else if (!$("#elementprops-tab").hasClass("active-side-menu-item"))
    $("#elementprops-tab").click();
    
  // Redraw
  drawMaster();
}

/*
  Custom event handler for key releases
*/
function keyUp(e){
  if ($(document.activeElement).is("input") || $(document.activeElement).is("textarea"))
    return;
  
  var wasSet = (Globals.aDown || Globals.vDown);
  
  if (e.keyCode == 86) Globals.vDown = false;
  if (e.keyCode == 65) Globals.aDown = false;
  if (e.keyCode == 70) {
    Globals.fbdDown = false; 
    drawFBD();
  }
    
  // Lower flag for vector modification and rerun the simulation
  if(!Globals.vDown && !Globals.aDown){
    Globals.vChanging = false;
    if(Globals.numKeyframes == 1 && wasSet)
      attemptSimulation();
  }
}

/*
  Custom event handler for key presses
*/
function keyDown(e) {
  if ($(document.activeElement).is("input") || $(document.activeElement).is("textarea"))
    return;

  if (e.keyCode == 86) Globals.vDown = true; // Holding v
  if (e.keyCode == 65) Globals.aDown = true; // Holding a
  if (e.keyCode == 70) {                     // Holding f
    Globals.fbdDown = true; 
    drawFBD();
  }
  if((e.keyCode == 8 || e.keyCode == 46) && Globals.selectedBody) { // del and backspace
    e.preventDefault();

    // Delete the specified body, so long as it is not the origin!
    var index = bIndex(Globals.selectedBody);
    if(index !== 0)
      deleteBody(index);
  }
 
  // Raise flag that a vector is being modified
  if(Globals.vDown || Globals.aDown)
    Globals.vChanging = true;
}

/*
  Returns true if this simulation contains an element that restricts multiple keyframes, otherwise false
*/
function containsRestricted(){
  var bodies = Globals.world.getBodies();
  for(var i=0; i<bodies.length; i++){
    var type = bodyType(bodies[i]);
    if(type != "kinematics1D-origin" && type != "kinematics1D-mass" && type != "kinematics1D-origin")
      return true;
  }
  
  return false;
}

/*
  Opens the right slide menu
*/
function rightSlideMenuOpen(e){
  id = e.currentTarget.id;
  selector = "";
  if(id == "toolbox-tab"){
    selector = "toolbox";
  }
  else if(id == "elementprops-tab"){
    selector = "elementprops";
  }
  else if(id == "globalprops-tab"){
    selector = "globalprops";
  }
  else if(id == "overview-tab"){
    selector = "overview";
  }

  check = $("#" + selector).css("right");
  rightSlideMenuClose(e);

  if (check === "-280px") {
    $("#" + selector + " :input").attr("tabindex", "0"); //:input selects all <input> <textarea> <select> <button> within div
    $("#" + selector).css("right", "80px");
    $("#" + id).addClass("active-side-menu-item");
  }
}

/*
  Closes the right slide menu
*/
function rightSlideMenuClose(e){
  $("#toolbox :input").attr('tabindex', '-1'); //:input selects all <input> <textarea> <select> <button> within div
  $("#elementprops :input").attr('tabindex', '-1');
  $("#globalprops :input").attr('tabindex', '-1');
  $("#overview :input").attr('tabindex', '-1');

  $("#toolbox").css("right", "-280px");
  $("#elementprops").css("right", "-280px");
  $("#globalprops").css("right", "-280px");
  $("#overview").css("right", "-280px");

  $("#toolbox-tab").removeClass("active-side-menu-item");
  $("#elementprops-tab").removeClass("active-side-menu-item");
  $("#globalprops-tab").removeClass("active-side-menu-item");
  $("#overview-tab").removeClass("active-side-menu-item");
}

/*
  Opens the left slide menu
*/
function leftSlideMenuOpen(e){
  id = e.currentTarget.id;
  selector = "";
  if(id == "prompt-tab"){
    selector = "prompt-slide";
  }
  else if(id == "keyframes-tab"){
    selector = "keyframes-slide";
  }
  else if(id == "graphs-tab"){
    selector = "graphs-slide";
  }

  else if(id == "solution-tab"){
    selector = "solution-slide";
  }
  
  check = $("#" + selector).css("left");
  leftSlideMenuClose(e);

  if (check === "-600px") {
    $("#" + selector + " :input").attr("tabindex", "0"); //:input selects all <input> <textarea> <select> <button> within div
    $("#" + selector).css("left", "80px");
    $("#" + id).addClass("active-side-menu-item");
  }
}

/*
  Closes the left slide menu
*/
function leftSlideMenuClose(e) {
  $("#prompt-slide :input").attr('tabindex', '-1'); //:input selects all <input> <textarea> <select> <button> within div
  $("#keyframes-slide :input").attr('tabindex', '-1');
  $("#graphs-slide :input").attr('tabindex', '-1');
  $("#solution-slide :input").attr('tabindex', '-1');

  $("#prompt-slide").css("left", "-600px");
  $("#keyframes-slide").css("left", "-600px");
  $("#graphs-slide").css("left", "-600px");
  $("#solution-slide").css("left", "-600px");

  $("#prompt-tab").removeClass("active-side-menu-item");
  $("#keyframes-tab").removeClass("active-side-menu-item");
  $("#graphs-tab").removeClass("active-side-menu-item");
  $("#solution-tab").removeClass("active-side-menu-item");
}
