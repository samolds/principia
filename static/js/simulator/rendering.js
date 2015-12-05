/*
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
  drawMaster();
  Globals.frame++;
}

// Show variable values in html elements
function displayVariableValues(body){
  var variables = Globals.variableMap[Globals.world.getBodies().indexOf(body)];
  displayElementValues(body);
  if (variables && body) {
    if (Globals.keyframe == 0) {
      $('#properties-position-x').val(variables["x0"]);
      $('#properties-velocity-x').val(variables["v0"]);
      $('#properties-acceleration-x').val(variables["a"]);
    } else {
      $('#properties-position-x').val(variables["xf"]);
      $('#properties-velocity-x').val(variables["vf"]);
      $('#properties-acceleration-x').val(variables["a"]);
    }
    
    
  }
}

// Shows elements values in html elements
function displayElementValues(bod){
  if (bod) {
    var st = bod.state;
    var constants = Globals.bodyConstants[Globals.world.getBodies().indexOf(bod)];
    $('#properties-position-x').val(st.pos.x);
    $('#properties-position-y').val(st.pos.y);
    $('#properties-velocity-x').val(st.vel.x);
    $('#properties-velocity-y').val(st.vel.y);
    $('#properties-acceleration-x').val(st.acc.x + Globals.gravity[0]);
    $('#properties-acceleration-y').val(st.acc.y + Globals.gravity[1]);
    $('#properties-mass').val(constants.mass);
    $('#properties-nickname').val(constants.nickname);
    if (constants.nickname) {
      $('#properties-nickname-title').text(constants.nickname + " ");
    } else {
      $('#properties-nickname-title').text("");
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
    $('#properties-nickname-title').text("");
  }
}

// Draw a line between a component and its parent element (handles drawing springs, ropes)
function drawLines(){		
	var bodies = Globals.world.getBodies();
  var bodyConst = Globals.bodyConstants;
	for (var i = 0; i < bodies.length; i++)
		if(bodyConst[i].parent)
			drawSpringLine(bodyConst[i].parent, bodies[i]);
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
	
  // Get the minimum and maximum x-coordinates
	var xmin = x1 < x2? x1: x2; var xmax = x1 > x2? x1: x2;
	
  // Associate starting and ending y-coordinates with corresponding x-coordinate
	var ys = (x1 == xmin)? y1:y2; var ye = (x1 == xmin)? y2:y1;
	
  // Save difference in x and y and corresponding slope
  var dx = xmax-xmin; var dy = ye-ys; var m = dy/dx;
  
  // Save angle from x-axis
  var theta = Math.atan2(dy, dx) * 180 / Math.PI; // range (-PI, PI]
  
  // Initialize x and y: x and y will store the "canonical" line with no perturbations
	var x = xmin; var y =  ys;	
	ctx.beginPath();
	ctx.moveTo(x,y);
	
  var d = distance(x1,y1,x2,y2);
  
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
  
	for(; x<=xmax; x+=incr){
    incr = (Math.abs(x - xmin) < delta || Math.abs(x - xmax) < delta) ? 1: Math.PI/2;
    var xnew = x;
    var ynew = y + Math.sin(x*wavelength)*amplitude;
    
    ctx.lineTo(xnew,ynew);
   
		y += (m*incr);
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

function drawProperties(){
  var propWin = $("#properties")[0].classList;
  if (Globals.selectedBody) {
    propWin.remove("hide");
  } else if (!propWin.contains("hide")) {
    propWin.add("hide");
  }
}

function drawVectors(){
  var maxLength = 0;
  var bodies = Globals.world.getBodies();
  for(var i=0; i < bodies.length; i++){
    if(Math.abs(bodies[i].state.vel.x) > maxLength) maxLength = Math.abs(bodies[i].state.vel.x);
    if(Math.abs(bodies[i].state.vel.y) > maxLength) maxLength = Math.abs(bodies[i].state.vel.y);
  }
  
  for(var i=0; i < bodies.length; i++){
    drawVectorLine(bodies[i], maxLength);
  } 
}

function drawVectorLine(body, maxV){
  var x_amt = (body.state.vel.x / maxV) * 100.0;
  var y_amt = (body.state.vel.y / maxV) * 100.0;
  var canvas = Globals.world.renderer();
	var ctx = canvas.ctx;
  
  if(Math.sign(x_amt) == 1)ctx.strokeStyle = '#00ff00'; // green
  else ctx.strokeStyle = '#ff0000'; // red
  
	ctx.lineWidth = 3;
  
  ctx.beginPath();
  ctx.moveTo(body.state.pos.x,body.state.pos.y);
  ctx.lineTo(body.state.pos.x + x_amt, body.state.pos.y);
  ctx.lineTo(body.state.pos.x + x_amt + -Math.sign(x_amt)*0.1*Math.abs(x_amt), body.state.pos.y - 5);
  ctx.stroke();
  
  if(Math.sign(y_amt) == 1)ctx.strokeStyle = '#ff0000'; // red
  else ctx.strokeStyle = '#00ff00'; // green
  
  ctx.beginPath();
  ctx.moveTo(body.state.pos.x,body.state.pos.y);
  ctx.lineTo(body.state.pos.x, body.state.pos.y + y_amt);
  ctx.lineTo(body.state.pos.x - 5, body.state.pos.y + y_amt + -Math.sign(y_amt)*0.1*Math.abs(y_amt));
  ctx.stroke();
}

// Copy global canvas into canvas for keyframe n
function viewportToKeyCanvas(n){
  var canvas = $('#' + Globals.canvasId)[0].children[0];  
	var keycanvas = $("#keyframe-" + n)[0];
	keycanvas.getContext('2d').clearRect(0, 0, keycanvas.width, keycanvas.height);
	keycanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, keycanvas.width, keycanvas.height);
}

function postRender(isKeyframe){
  var selectedBody = Globals.selectedBody;
  if(isKeyframe && Globals.useKeyframes){ viewportToKeyCanvas(Globals.keyframe); displayVariableValues(selectedBody); }
  else { displayElementValues(selectedBody); }
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