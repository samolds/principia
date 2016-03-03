/*
  rendering.js -- 
  This file contains functions for rendering the simulation itself.
  This includes drawing the PhysicsJS world as well as post-world.render() effects (springs, vectors)
*/

// Continuously draws simulation frames
function drawLoop(){
  // Reset to beginning after reaching final frame
  if (Globals.frame > Globals.totalFrames) { Globals.frame = 0;}

  // Update range, draw simulation at that frame, and increment counter
  $("#simulatorFrameRange").val(Globals.frame)
  
  Globals.keyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? kIndex(Globals.frame): false;   
  highlightKeycanvas(Globals.keyframe);
  
  drawMaster();
  updatePVAChart();
  Globals.frame++;
}

// Show variable values in html elements
function displayVariableValues(body){
  var variables = Globals.variableMap[Globals.keyframe][bIndex(body)];
  var precision = Globals.dPrecision;
  displayElementValues(body);
  if (variables && body){
    
    // Convert to user coordinate system before displaying position
    var position = physics2Origin([variables["posx"], variables["posy"]]);
    var velocity = [variables["velx"], variables["vely"]];
    var acceleration = [variables["accx"], variables["accy"]];
    
    // Use user unit
    position = [convertUnit(position[0], "posx", false), convertUnit(position[1], "posy", false)];
    
    // Convert to Polar coordinates, if necessary
    if(Globals.coordinateSystem == "polar"){
      position = cartesian2Polar([position[0], position[1]]);
      
      var temp;
      if(velocity[1] == "?") 
        temp = velocity[0];      
      velocity = cartesian2Polar([velocity[0], velocity[1]]);
      
      if(temp) 
        velocity = [temp, "?"];
      
      acceleration = cartesian2Polar([acceleration[0], acceleration[1]]);
    }
    
    // TODO fix unit conversions
    $('#general-properties-position-x').val(position[0].toFixed(precision));
    $('#general-properties-position-y').val(position[1].toFixed(precision));

    if(velocity[0]) {
      $('#pointmass-properties-velocity-x').val((velocity[0] == "?")? "":velocity[0].toFixed(precision));
      $('#pointmass-properties-velocity-y').val((velocity[1] == "?")? "":(-1 * velocity[1]).toFixed(precision));
    }

    if(acceleration[0]) {
      $('#pointmass-properties-acceleration-x').val(acceleration[0].toFixed(precision));
      $('#pointmass-properties-acceleration-y').val(acceleration[1].toFixed(precision));
    }
  } 
}

// Shows elements values in html elements
function displayElementValues(bod){
  if (bod) {
    var st = bod.state;
    var constants = Globals.bodyConstants[Globals.world.getBodies().indexOf(bod)];
    var selected = constants.img;
    if (constants.ctype === "kinematics1D-mass") {
      $('#pointmass-properties-img option[value=' + selected +']').attr('selected', 'selected');
    }
    var precision = Globals.dPrecision;
    
    // Convert to user coordinate system before displaying position
    var position = physics2Origin([st.pos.x, st.pos.y]);
    var velocity = [st.vel.x, st.vel.y];
    var acceleration = [st.acc.x, st.acc.y];
    
    // Convert to user unit
    position = [convertUnit(position[0], "posx", false), convertUnit(position[1], "posy", false)];
    
    // Convert to Polar coordinates, if necessary
    if(Globals.coordinateSystem == "polar"){
      position = cartesian2Polar([position[0], position[1]]);
      velocity = cartesian2Polar([velocity[0], velocity[1]]);
      acceleration = cartesian2Polar([acceleration[0], acceleration[1]]);
    }
      
    if (constants.nickname) {
      $('#general-properties-nickname-title').text(constants.nickname + " ");
    } else {
      $('#general-properties-nickname-title').text("");
    }

    $('#general-properties-nickname').val(constants.nickname);
    $('#general-properties-position-x').val(position[0].toFixed(precision));
    $('#general-properties-position-y').val(position[1].toFixed(precision));

    $('#pointmass-properties-velocity-x').val(convertUnit(velocity[0], "velx", false).toFixed(precision));
    $('#pointmass-properties-velocity-y').val((-1 * convertUnit(velocity[1], "vely", false)).toFixed(precision));
    $('#pointmass-properties-acceleration-x').val(convertUnit(acceleration[0], "accx", false).toFixed(precision));
    $('#pointmass-properties-acceleration-y').val((-1 * convertUnit(acceleration[1], "accy", false)).toFixed(precision));
    $('#pointmass-properties-mass').val(constants.mass);
    $('#pointmass-properties-size').val(constants.size);

    $('#pointmass-properties-vector')[0].checked = constants.vectors;
    $('#pointmass-properties-pvagraph')[0].checked = constants.showGraph;

    $('#ramp-properties-width').val(constants.width);
    $('#ramp-properties-height').val(constants.height);
    $('#ramp-properties-angle').val(constants.angle);
    
  } else {
    $('#general-properties-nickname').val("");
    $('#general-properties-nickname-title').text("");
    $('#general-properties-position-x').val("");
    $('#general-properties-position-y').val("");

    $('#pointmass-properties-velocity-x').val("");
    $('#pointmass-properties-velocity-y').val("");
    $('#pointmass-properties-acceleration-x').val("");
    $('#pointmass-properties-acceleration-y').val("");
    $('#pointmass-properties-mass').val("");
    $('#pointmass-properties-size').val("");

    $('#ramp-properties-width').val("");
    $('#ramp-properties-height').val("");
    $('#ramp-properties-angle').val("");
  }
}

// Draw a line between a component and its parent element (handles drawing springs, ropes)
function drawLines(){
  var bodies = Globals.world.getBodies();
  var bodyConst = Globals.bodyConstants;
  for (var i = 0; i < bodies.length; i++){
    
    // If the current body has a parent, it is assumed to be a spring-child.
    // Connect them.
    if(bodyConst[i].parent || bodyConst[i].parent === 0)
      drawSpringLine(bodies[bodyConst[i].parent], bodies[i]);
    
    // If the current body is attached to something and that something is a pulley...    
    if((bodyConst[i].attachedTo || bodyConst[i].attachedTo === 0) && bodyConst[bodyConst[i].attachedTo].ctype == "kinematics1D-pulley"){
      drawRopeLine(bodies[bodyConst[i].attachedTo], bodies[i]);
    }
  }
}

// b1 is pulley, b2 is attached mass
function drawRopeLine(b1, b2){
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  
  ctx.strokeStyle = '#111111'; // Black
  ctx.lineWidth = 4;
  
  // Get the coordinates of each body
  var x1 = b1.state.pos.x; var y1 = b1.state.pos.y;
  var x2 = b2.state.pos.x; var y2 = b2.state.pos.y;
  
  // Get modifier based on pulley radius and which side of the pulley it is on
  var radius = Globals.bodyConstants[bIndex(b1)].radius;
  if(Globals.bodyConstants[bIndex(b2)].side == "left")
    radius *= -1;
  
  ctx.beginPath();
  ctx.moveTo(x1 + radius,y1);  
  ctx.lineTo(x2,y2);
  ctx.stroke();
  
}

// Draws a sine wave between the two specified bodies
// TODO: Have separate functions for drawing springs and other lines when other components are supported.
function drawSpringLine(b1, b2){
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  
  ctx.strokeStyle = '#aaaaaa'; // Gray
  ctx.lineWidth = 3;
  
  // Get the coordinates of each body
  var x1 = b1.state.pos.x; var y1 = b1.state.pos.y;
  var x2 = b2.state.pos.x; var y2 = b2.state.pos.y;
  var d = distance(x1,y1,x2,y2);
  var angle = Math.atan2(y2-y1, x2-x1) * 180 / Math.PI;
  // -0.001 to -179.9999 is upper
  // 180 to 0 is lower
  
  // Determine properties of sine wave based on how far the spring is stretched
  var wavelength, amplitude;
  if(d > 600)      { wavelength = 0.5; amplitude = 1; }
  else if(d > 550) { wavelength = 0.5; amplitude = 2; }
  else if(d > 500) { wavelength = 0.5; amplitude = 3; }
  else if(d > 450) { wavelength = 0.5; amplitude = 4; }
  else if(d > 400) { wavelength = 0.5; amplitude = 5; }
  else if(d > 350) { wavelength = 0.5; amplitude = 6; }
  else if(d > 300) { wavelength = 0.5; amplitude = 7; }
  else if(d > 250) { wavelength = 0.5; amplitude = 8; }
  else if(d > 200) { wavelength = 0.5; amplitude = 9; }
  else if(d > 150) { wavelength = 0.5; amplitude = 16; }
  else if(d > 100) { wavelength = 0.5; amplitude = 18; }
  else             { wavelength = 0.5; amplitude = 20; }
      
  var incr;         // Amount to increment before drawing next point
  var delta   = 10; // If within delta from x or xmax, modify increment
  
  var swap = (angle < -45 && angle > -135) || (angle < 135 && angle > 45)
  if(swap)
  {
    var ymin = y1 < y2? y1: y2; var ymax = y1 > y2? y1: y2;
    var xs = (y1 == ymin)? x1:x2; var xe = (y1 == ymin)? x2:x1;
    var dy = ymax-ymin; var dx = xe-xs; var m = dx/dy;
    
    var x = xs; var y = ymin;
    
    ctx.beginPath();
    ctx.moveTo(x,y);
    for(; y<=ymax; y+=incr){
      incr = (Math.abs(y - ymin) < delta || Math.abs(y - ymax) < delta) ? 1: Math.PI/2;
      var xnew = x + Math.sin(y*wavelength)*amplitude;
      var ynew = y;    
      ctx.lineTo(xnew,ynew);
      x += (m*incr);
    }
  }
  else
  {
    var xmin = x1 < x2? x1: x2; var xmax = x1 > x2? x1: x2;    
    var ys = (x1 == xmin)? y1:y2; var ye = (x1 == xmin)? y2:y1;      
    var dx = xmax-xmin; var dy = ye-ys; var m = dy/dx;
    
    // Initialize x and y: x and y will store the "canonical" line with no perturbations
    var x = xmin; var y =  ys;  
    
    ctx.beginPath();
    ctx.moveTo(x,y);  
    for(; x<=xmax; x+=incr){
      incr = (Math.abs(x - xmin) < delta || Math.abs(x - xmax) < delta) ? 1: Math.PI/2;
      var xnew = x;
      var ynew = y + Math.sin(x*wavelength)*amplitude;    
      ctx.lineTo(xnew,ynew);
      y += (m*incr);
    }
  }
   
  ctx.stroke();
}

// Draws highlight box around selected element
function highlightSelection(body, color, modifier){
  var bodyDim = body.aabb();
  var width = bodyDim.hw * 2;
  var height = bodyDim.hh * 2;
  var canvas = Globals.world.renderer();

  if (modifier) {
    width += modifier;
    height += modifier;
  } else {
    width += 10;
    height += 10;
  }
  
  // Default to red
  canvas.ctx.strokeStyle = '#ff0000';
  
  // Otherwise use provided color
  if(color)
    canvas.ctx.strokeStyle = color;
  
  canvas.ctx.lineWidth = 2;

  var centerX = bodyDim.x - (width / 2);
  var centerY = bodyDim.y - (height / 2);

  canvas.ctx.strokeRect(centerX, centerY, width, height);
}

// Opens the properties tab
function drawProperties(){
  if (Globals.selectedBody) {
    document.getElementById("elementprops-tab").click();
  }
}

// Draws a vector for each body
function drawVectors(){
  var maxVx = 0;
  var maxVy = 0;
  var maxAx = 0;
  var maxAy = 0;
  
  var bodies = Globals.world.getBodies();
  for(var i=0; i < bodies.length; i++){
    if(Math.abs(bodies[i].state.vel.x) > maxVx) maxVx = Math.abs(bodies[i].state.vel.x);
    if(Math.abs(bodies[i].state.vel.y) > maxVy) maxVy = Math.abs(bodies[i].state.vel.y);
    if(Math.abs(bodies[i].state.acc.x + Globals.gravity[0]) > maxAx) maxAx = Math.abs(bodies[i].state.acc.x + Globals.gravity[0]);
    if(Math.abs(bodies[i].state.acc.y + Globals.gravity[1]) > maxAy) maxAy = Math.abs(bodies[i].state.acc.y + Globals.gravity[1]);
  }
  
  for(var i=0; i < bodies.length; i++){
    if(!Globals.bodyConstants[i].vectors) continue;
    drawVectorLine(bodies[i], maxVx, maxVy, maxAx, maxAy);
  } 
}

// Draw a vector for the specified body, scaled using the provided arguments
function drawVectorLine(body, maxVx, maxVy, maxAx, maxAy){
  
  maxVx = maxVx > 25? maxVx: 25;
  maxVy = maxVy > 25? maxVy: 25;
  maxAx = maxAx > 5? maxAx: 5;
  maxAy = maxAy > 5? maxAy: 5;
  
  var vx_amt = (body.state.vel.x / maxVx) * 200.0;
  var vy_amt = (body.state.vel.y / maxVy) * 200.0;
  var ax_amt = ((body.state.acc.x + Globals.gravity[0]) / maxAx) * 100.0;
  var ay_amt = ((body.state.acc.y + Globals.gravity[1]) / maxAy) * 100.0;
  
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  ctx.lineWidth = 3;
  
  if(vx_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(vx_amt) == 1)? '#00ff00': '#ff0000';    
    ctx.beginPath();
    ctx.moveTo(body.state.pos.x,body.state.pos.y);
    ctx.lineTo(body.state.pos.x + vx_amt, body.state.pos.y);
    ctx.lineTo(body.state.pos.x + vx_amt + -Math.sign(vx_amt)*0.1*Math.abs(vx_amt), body.state.pos.y - 5);
    ctx.stroke();
  }

  if(ax_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(ax_amt) == 1)? '#009900': '#990000';
    ctx.beginPath();
    ctx.moveTo(body.state.pos.x,body.state.pos.y);
    ctx.lineTo(body.state.pos.x + ax_amt * 0.8, body.state.pos.y);
    ctx.lineTo(body.state.pos.x + ax_amt * 0.8 + -Math.sign(ax_amt)*0.1*Math.abs(ax_amt), body.state.pos.y - 7);  
    ctx.lineTo(body.state.pos.x + ax_amt * 0.8, body.state.pos.y);
    ctx.lineTo(body.state.pos.x + ax_amt, body.state.pos.y);
    ctx.lineTo(body.state.pos.x + ax_amt + -Math.sign(ax_amt)*0.1*Math.abs(ax_amt), body.state.pos.y - 7);  
    ctx.stroke();
  }
  
  if(vy_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(vy_amt) == 1)? '#ff0000': '#00ff00';
    ctx.beginPath();
    ctx.moveTo(body.state.pos.x,body.state.pos.y);
    ctx.lineTo(body.state.pos.x, body.state.pos.y + vy_amt);
    ctx.lineTo(body.state.pos.x - 5, body.state.pos.y + vy_amt + -Math.sign(vy_amt)*0.1*Math.abs(vy_amt));
    ctx.stroke();
  }
  
  if(ay_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(ay_amt) == 1)? '#990000': '#009900';
    ctx.beginPath();
    ctx.moveTo(body.state.pos.x,body.state.pos.y);
    ctx.lineTo(body.state.pos.x,     body.state.pos.y + 0.8*ay_amt);    
    ctx.lineTo(body.state.pos.x - 5, body.state.pos.y + 0.8*ay_amt + -Math.sign(ay_amt)*0.1*Math.abs(ay_amt));  
    ctx.lineTo(body.state.pos.x,     body.state.pos.y + 0.8*ay_amt);    
    ctx.lineTo(body.state.pos.x, body.state.pos.y + ay_amt);
    ctx.lineTo(body.state.pos.x - 5, body.state.pos.y + ay_amt + -Math.sign(ay_amt)*0.1*Math.abs(ay_amt));  
    ctx.stroke();
  }
}

// Copy global canvas into canvas for keyframe n
function viewportToKeyCanvas(n){
  if(n === false) n = lastKF();  
  var canvas = $('#' + Globals.canvasId)[0].children[0];  
  var keycanvas = $("#keyframe-" + n)[0];
  keycanvas.getContext('2d').clearRect(0, 0, keycanvas.width, keycanvas.height);
  keycanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, keycanvas.width, keycanvas.height);
}

function drawOrigin(){
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff0000';    
  
  
  var length = 10;
  
  ctx.beginPath();
  ctx.moveTo(Globals.origin[0], Globals.origin[1]);
  ctx.lineTo(Globals.origin[0] + length, Globals.origin[1]);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(Globals.origin[0], Globals.origin[1]);
  ctx.lineTo(Globals.origin[0] - length, Globals.origin[1]);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(Globals.origin[0], Globals.origin[1]);
  ctx.lineTo(Globals.origin[0], Globals.origin[1] + length);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(Globals.origin[0], Globals.origin[1]);
  ctx.lineTo(Globals.origin[0], Globals.origin[1] - length);
  ctx.stroke();
}

// Adds post world.render() effects including property windows, springs, vectors, and highlights.
function postRender(isKeyframe){
  var selectedBody = Globals.selectedBody;
  var originObject = Globals.originObject;
  
  drawOrigin();
  drawLines();
  drawVectors();

  if (selectedBody) {    
    var bodConstants = Globals.bodyConstants[bIndex(selectedBody)];
    $('#general-properties').addClass('hide');
    $('#pointmass-properties').addClass('hide');
    $('#ramp-properties').addClass('hide');
    $('#general-properties').removeClass('hide');

    switch (bodConstants.ctype) {
      case 'kinematics1D-mass':
        $('#pointmass-properties').removeClass('hide');
        break;
      case 'kinematics1D-ramp':
        $('#ramp-properties').removeClass('hide');
        break;
      case 'kinematics1D-spring':
        break;
    }
  } else {
    $('#general-properties').addClass('hide');
    $('#pointmass-properties').addClass('hide');
    $('#ramp-properties').addClass('hide');
  }

  if(isKeyframe){
    viewportToKeyCanvas(Globals.keyframe);
    displayVariableValues(selectedBody); 
  }
  else {
    displayElementValues(selectedBody);
  }
  
  if(selectedBody)
    highlightSelection(selectedBody);
  
  if (originObject !== false) {
    highlightSelection(Globals.world.getBodies()[originObject], '#00ff00', -10);
  }
}

// Draws a blue highlight around the nth mini-keyframe canvas
// Removes all highlights if n === false
function highlightKeycanvas(n)
{
  // Remove highlight on all keyframes
  for(var i=0; i < Globals.numKeyframes; i++)
    $("#" + "keyframe-" + i).attr("style","");
  
  // Add highlight to nth keyframe
  if(n !== false)
    $("#" + "keyframe-" + n).attr("style","border:4px solid #0000cc");
}

// Sets the world state to the currently selected frame and renders it.
function drawMaster(){
  var world = Globals.world;
  var frame = Globals.frame;
  var keyframe = Globals.keyframe;
  
  if(keyframe !== false){
    setStateKF(keyframe);
    world.render();
    postRender(true);
  }
  else if(frame !== false) {
    setState(frame);
    world.render();
    postRender(false);
  }
}
