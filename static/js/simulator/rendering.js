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
  setState(Globals.frame);
  if(Globals.useKeyframes)
    Globals.keyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? Globals.frame: false; 
  
  $("#" + "keyframe-0").attr("style","");
  $("#" + "keyframe-1").attr("style","");
  
  drawMaster();
  Globals.frame++;
}

// Show variable values in html elements
function displayVariableValues(body){
  var variables = Globals.variableMap[Globals.world.getBodies().indexOf(body)];
  var precision = Globals.dPrecision;
  displayElementValues(body);
  if (variables && body){
    if (Globals.keyframe == 0){
      $('#properties-position-x').val(variables["x0"].toFixed(precision));
      $('#properties-position-y').val(variables["y0"].toFixed(precision));
      $('#properties-velocity-x').val(variables["vx0"].toFixed(precision));
      $('#properties-velocity-y').val(variables["vy0"].toFixed(precision));
      $('#properties-acceleration-x').val(variables["ax"].toFixed(precision));
      $('#properties-acceleration-y').val(variables["ay"].toFixed(precision));
    } else {
      $('#properties-position-x').val(variables["xf"].toFixed(precision));
      $('#properties-position-y').val(variables["yf"].toFixed(precision));
      $('#properties-velocity-x').val(variables["vxf"].toFixed(precision));
      $('#properties-velocity-y').val(variables["vyf"].toFixed(precision));
      $('#properties-acceleration-x').val(variables["ax"].toFixed(precision));
      $('#properties-acceleration-y').val(variables["ay"].toFixed(precision));
    }
 

  }
}

// Shows elements values in html elements
function displayElementValues(bod){
  if (bod) {
    var st = bod.state;
    var constants = Globals.bodyConstants[Globals.world.getBodies().indexOf(bod)];
    var selected = constants.img;
    $('#properties-img option[value=' + selected +']').attr('selected', 'selected');
    var precision = Globals.dPrecision;
    $('#properties-position-x').val(st.pos.x.toFixed(precision));
    $('#properties-position-y').val(st.pos.y.toFixed(precision));
    $('#properties-velocity-x').val(st.vel.x.toFixed(precision));
    $('#properties-velocity-y').val(st.vel.y.toFixed(precision));
    $('#properties-acceleration-x').val(st.acc.x.toFixed(precision));
    $('#properties-acceleration-y').val(st.acc.y.toFixed(precision));
    $('#properties-mass').val(constants.mass);
    $('#properties-size').val(constants.size);
    $('#properties-nickname').val(constants.nickname);
    if (constants.nickname) {
      $('#properties-nickname-title').text(constants.nickname + " ");
    } else {
      $('#properties-nickname-title').text("");
    }
    
    if(constants.ctype == "kinematics1D-mass"){
      $('#properties-img-container')[0].classList.remove("hide");
      $('#properties-size-container')[0].classList.remove("hide");
    }
    else {
      if(!$('#properties-img')[0].classList.contains("hide")){
        $('#properties-img-container')[0].classList.add("hide");
        $('#properties-size-container')[0].classList.add("hide");
      }
    }
    
  } else {
    $('#properties-position-x').val("");
    $('#properties-position-y').val("");
    $('#properties-velocity-x').val("");
    $('#properties-velocity-y').val("");
    $('#properties-acceleration-x').val("");
    $('#properties-acceleration-y').val("");
    $('#properties-mass').val("");
    $('#properties-name').val("");
    $('#properties-size').val("");
    $('#properties-nickname-title').text("");    
  }
}

// Draw a line between a component and its parent element (handles drawing springs, ropes)
function drawLines(){
  var bodies = Globals.world.getBodies();
  var bodyConst = Globals.bodyConstants;
  for (var i = 0; i < bodies.length; i++)
    if(bodyConst[i].parent || bodyConst[i].parent === 0)
      drawSpringLine(bodies[bodyConst[i].parent], bodies[i]);
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
function highlightSelection(body){
  var img = body.view;
  var halfw = img["width"] / 2;
  var halfh = img["height"] / 2;
  var canvas = Globals.world.renderer();

  canvas.ctx.strokeStyle = '#ff0000';
  canvas.ctx.lineWidth = 2;

  var loc = body.state.pos;
  canvas.ctx.strokeRect(loc.x-halfw*2, loc.y-halfh*2, halfw*4, halfh*4);
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
  if(n > 0) n = 1; //TODO: Map n to the appropriate keyframe index
  var canvas = $('#' + Globals.canvasId)[0].children[0];  
  var keycanvas = $("#keyframe-" + n)[0];
  keycanvas.getContext('2d').clearRect(0, 0, keycanvas.width, keycanvas.height);
  keycanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, keycanvas.width, keycanvas.height);
}

// Adds post world.render() effects including property windows, springs, vectors, and highlights.
function postRender(isKeyframe){
  var selectedBody = Globals.selectedBody;
  if(isKeyframe && Globals.useKeyframes){
    viewportToKeyCanvas(Globals.keyframe); 
    displayVariableValues(selectedBody); 
  }
  else {
    displayElementValues(selectedBody);
  }
  
  if(selectedBody){
    var checkbox = document.getElementById('vector-checkbox');
    checkbox.checked = Globals.bodyConstants[bIndex(selectedBody)].vectors;
  }
  
  drawLines();
  drawVectors();

  if(selectedBody) { highlightSelection(selectedBody); }
  drawProperties();
}

// Sets the world state to the currently selected frame and renders it.
function drawMaster(){
  var world = Globals.world;
  var frame = Globals.frame;
  var keyframe = Globals.keyframe;
  
  if((keyframe || keyframe === 0) && Globals.useKeyframes){
    setStateKF(keyframe);
    world.render();
    postRender(true);
  }
  else if(frame === 0 || frame) {
    setState(frame);
    world.render();
    postRender(false);
  }
}