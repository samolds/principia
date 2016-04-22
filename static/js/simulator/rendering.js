/*
  rendering.js -- 
  This file contains functions for rendering the simulation itself
  This includes drawing the PhysicsJS world as well as post-world.render() special effects (springs, vectors)
*/

/*
  Continuously draws simulation frames
*/
function drawLoop(){
  // Reset to beginning after reaching final frame
  if (Globals.frame > Globals.totalFrames) { Globals.frame = 0;}

  // Update range, draw simulation at that frame, and increment counter
  $("#simulatorFrameRange").val(Globals.frame)
  
  // Assign a keyframe if the current frame is in the keyframes array  
  Globals.keyframe = ($.inArray(parseInt(Globals.frame), Globals.keyframes) != -1)? kIndex(Globals.frame): false;   
  updateRangeLabel();
  highlightKeycanvas(Globals.keyframe, "yellow");
  
  // Render the current frame and chart
  drawMaster();
  updatePVAChart();
  
  // Increment frame counter
  Globals.frame++;
}

/* 
  Displays variable values in html elements
*/
function displayVariableValues(body){
  var variables = Globals.variableMap[Globals.keyframe][bIndex(body)];
  var precision = Globals.dPrecision;
  
  // First pass is done via displayElementValues to catch any values not stored in variable map
  displayElementValues(body);
  
  if (variables && body){
    
    // Convert to user coordinate system before displaying position
    var position = physics2Origin([variables["posx"], variables["posy"]]);
    var velocity = [variables["velx"], variables["vely"]];
    var acceleration = [variables["accx"], variables["accy"]];
    
    // Convert to user unit, too
    position = [convertUnit(position[0], "posx", false), convertUnit(position[1], "posy", false)];
    velocity = [convertUnit(velocity[0], "velx", false), convertUnit(velocity[1], "vely", false)];
    acceleration = [convertUnit(acceleration[0], "accx", false), convertUnit(acceleration[1], "accy", false)];
    
    // Convert to Polar coordinates, if necessary
    if(Globals.coordinateSystem == "polar"){
           
      // Temp values are used to undo transformation to polar coordinates in case of unknown value
      var temp;
      if(position[1] == "?") temp = position[0];      
      position = cartesian2Polar([position[0], position[1]]);
      if(temp) position = [temp, "?"];
      
      temp = null;
      if(velocity[1] == "?") temp = velocity[0];      
      velocity = cartesian2Polar([velocity[0], velocity[1]]);      
      if(temp) velocity = [temp, "?"];
      
      temp = null;
      if(acceleration[1] == "?") temp = acceleration[0];
      acceleration = cartesian2Polar([acceleration[0], acceleration[1]]);
      if(temp) acceleration = [temp, "?"];
    }
       
    // Display position
    $('#general-properties-position-x').val(position[0].toFixed(precision));
    $('#general-properties-position-y').val(position[1].toFixed(precision));

    // Display velocity
    if(velocity[0]) {
      $('#pointmass-properties-velocity-x').val((velocity[0] == "?")? "":velocity[0].toFixed(precision));
      $('#pointmass-properties-velocity-y').val((velocity[1] == "?")? "":(velocity[1]).toFixed(precision));
    }

    // Display acceleration
    if(acceleration[0]) {
      $('#pointmass-properties-acceleration-x').val((acceleration[0] == "?")? "":acceleration[0].toFixed(precision));
      $('#pointmass-properties-acceleration-y').val((acceleration[1] == "?")? "":acceleration[1].toFixed(precision));
    }
    
    // NaN is used to indicate unknowns: Display this in the HTML element if necessary
    if(isNaN(position[0])) $('#general-properties-position-x').val("Unknown");
    if(isNaN(position[1])) $('#general-properties-position-y').val("Unknown");
    if(isNaN(velocity[0])) $('#pointmass-properties-velocity-x').val("Unknown");
    if(isNaN(velocity[1])) $('#pointmass-properties-velocity-y').val("Unknown");
    if(isNaN(acceleration[0])) $('#pointmass-properties-acceleration-x').val("Unknown");
    if(isNaN(acceleration[1])) $('#pointmass-properties-acceleration-y').val("Unknown");
  } 
}

/* 
  Updates HTML elements to display the specified body's properties
*/
function displayElementValues(bod){
  if (bod) {
    var st = bod.state;
    var constants = Globals.bodyConstants[Globals.world.getBodies().indexOf(bod)];
    var selected = constants.img;
    
    // Special case: Handle image type for the two varying point masses
    if (constants.ctype === "kinematics1D-mass") {
      if (constants.massType === "square") {
        $('#pointmass-properties-img option')[1].setAttribute("value", 1);
        if (selected === 0)
          selected = 1;
      } else {
        $('#pointmass-properties-img option')[1].setAttribute("value", 0);
      }

      $('#pointmass-properties-img option[value=' + selected +']').attr('selected', 'selected');
    }
    
    var precision = Globals.dPrecision;
    
    // Convert to user coordinate system before displaying position
    var scaleFactor = getScaleFactor();
    var position = physics2Origin([st.pos.x*scaleFactor, swapYpos(st.pos.y, false)*scaleFactor]);
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
      
    // Display the nickname
    if (constants.nickname) {
      $('#general-properties-nickname-title').text(constants.nickname + " ");
    } else {
      $('#general-properties-nickname-title').text("");
    }
    $('#general-properties-nickname').val(constants.nickname);
    
    // Display position
    $('#general-properties-position-x').val(position[0].toFixed(precision));
    $('#general-properties-position-y').val(position[1].toFixed(precision));

    // Invert coordinate system if using cartesian coordinates for y value
    var mod = (Globals.coordinateSystem == "cartesian")? -1: 1;
    
    // Display properties specific to object type
    if (constants.ctype === "kinematics1D-mass") {
      $('#pointmass-properties-velocity-x').val(convertUnit(velocity[0], "velx", false).toFixed(precision));
      $('#pointmass-properties-velocity-y').val((mod * convertUnit(velocity[1], "vely", false)).toFixed(precision));
      $('#pointmass-properties-acceleration-x').val(convertUnit(acceleration[0], "accx", false).toFixed(precision));
      $('#pointmass-properties-acceleration-y').val((mod * convertUnit(acceleration[1], "accy", false)).toFixed(precision));
      $('#pointmass-properties-mass').val(constants.mass);
      $('#pointmass-properties-size').val(constants.size);
      $('#pointmass-properties-img').val(constants.img);

      var total_acceleration = totalAcceleration(bod);
      $('#pointmass-properties-acceleration-x-total').val(convertUnit(total_acceleration.x, "accx", false).toFixed(precision));
      $('#pointmass-properties-acceleration-y-total').val((mod * convertUnit(total_acceleration.y, "accy", false)).toFixed(precision));
      
      $('#pointmass-properties-vector')[0].checked = constants.vectors;
      $('#pointmass-properties-vector-ttt')[0].checked = constants.vectors_ttt;
      $('#pointmass-properties-pvagraph')[0].checked = constants.showGraph;
    } else if (constants.ctype === "kinematics1D-surface") {
      $('#surface-properties-width').val(Math.abs(constants.surfaceWidth));
      $('#surface-properties-height').val(Math.abs(constants.surfaceHeight));
      $('#surface-properties-friction').val(Math.abs(constants.surfaceFriction));
    } else if (constants.ctype === "kinematics1D-ramp") {
      $('#ramp-properties-width').val(Math.abs(constants.rampWidth));
      $('#ramp-properties-height').val(Math.abs(constants.rampHeight));
      $('#ramp-properties-angle').val(Math.abs(constants.rampAngle));
      $('#ramp-properties-friction').val(Math.abs(constants.rampFriction));
    } else if (constants.ctype === "kinematics1D-spring" || constants.ctype === "kinematics1D-spring-child"){      
      if(constants.ctype === "kinematics1D-spring")
        $('#spring-properties-k').val(Math.abs(constants.k));
      else
        $('#spring-properties-k').val(Math.abs(Globals.bodyConstants[constants.parent].k));
    }
    
    
  } else {
    // No body is selected: Blank out HTML elements
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

    $('#surface-properties-width').val("");
    $('#surface-properties-height').val("");
    $('#surface-properties-friction').val("");

    $('#ramp-properties-width').val("");
    $('#ramp-properties-height').val("");
    $('#ramp-properties-angle').val("");
    $('#ramp-properties-friction').val("");
  }
}

/* 
  Draw all lines between components and their parent elements (handles drawing springs, ropes) 
*/
function drawLines(){
  var bodies = Globals.world.getBodies();
  var bodyConst = Globals.bodyConstants;
  for (var i = 0; i < bodies.length; i++){
    
    // If the current body has a parent, it is assumed to be a spring-child.
    // Connect them.
    if(bodyConst[i].parent || bodyConst[i].parent === 0)
      drawSpringLine(bodies[bodyConst[i].parent], bodies[i]);
    
    // If the current body is attached to something and that something is a pulley, draw a rope
    if((bodyConst[i].attachedTo && bodyConst[i].attachedTo.length > 0)){      
      for(var j=0; j < bodyConst[i].attachedTo.length; j++)        
        if(bodyType(bodies[bodyConst[i].attachedTo[j]]) == "kinematics1D-pulley"){
          drawRopeLine(bodies[bodyConst[i].attachedTo[j]], bodies[i]);
        }
    }
  }
}

/*
  Draws a rope between b1 (a pulley) and b2 (an attached mass)
*/
function drawRopeLine(b1, b2){
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  
  ctx.strokeStyle = '#111111'; // Dark grey
  ctx.lineWidth = 4;
  
  // Get the coordinates of each body
  var x1 = b1.state.pos.x + Globals.translation.x; var y1 = b1.state.pos.y + Globals.translation.y;
  var x2 = b2.state.pos.x + Globals.translation.x; var y2 = b2.state.pos.y + Globals.translation.y;
  
  // Get modifier based on pulley radius and which side of the pulley it is on
  // Also apply padding to the rope appears to wrap around the pulley
  var radius = Globals.bodyConstants[bIndex(b1)].radius;
  var padding = 5;
  if(Globals.bodyConstants[bIndex(b2)].side == "left"){
    radius *= -1;
    padding *= -1;
  }
  
  // Draw the line from the pulley to the mass
  ctx.beginPath();
  ctx.moveTo(x1 + radius/getScaleFactor() - padding/getScaleFactor(), y1);
  ctx.lineTo(x2,y2);
  ctx.stroke();
}

/*
  Globally applies (value == true) or removes (value == false) the no-select class
*/
function setNoSelect(value){
  if(value)
    $("*").addClass('no-select');
  else
    $("*").removeClass('no-select');
}

/* 
  Draws a modified sine wave representing a spring between the two specified bodies (assumed a spring and a spring-child) 
*/
function drawSpringLine(b1, b2){
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  
  ctx.strokeStyle = '#aaaaaa'; // Gray
  ctx.lineWidth = 3;
  
  // Get the coordinates of each body
  var x1 = b1.state.pos.x + Globals.translation.x; var y1 = b1.state.pos.y + Globals.translation.y;
  var x2 = b2.state.pos.x + Globals.translation.x; var y2 = b2.state.pos.y + Globals.translation.y;
  var d = distance(x1,y1,x2,y2) * getScaleFactor();
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
  
  // Modify those properties based on the scale factor
  amplitude *= 1/getScaleFactor();
  wavelength *= getScaleFactor();
  
  var incr;         // Amount to increment before drawing next point
  var delta   = 10; // If within delta from x or xmax, modify increment (smooth wave towards endpoint)
  
  // Loop over x or y based on quadran
  var swap = (angle < -45 && angle > -135) || (angle < 135 && angle > 45)
  
  if(swap)
  {
    // Loop over y from ymin to ymax
    var ymin = y1 < y2? y1: y2; var ymax = y1 > y2? y1: y2;
    
    // Use xs(tart) as the first x coordinate, use dx and dy to determine slope
    var xs = (y1 == ymin)? x1:x2; var xe = (y1 == ymin)? x2:x1;
    var dy = ymax-ymin; var dx = xe-xs; var m = dx/dy;    
    
    // Simple aliases for chosen starting coordinates
    var x = xs; var y = ymin;
    
    // Start drawing the path using (x,y), increment by slope in x for each increase in y
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
    // See previous case
    var xmin = x1 < x2? x1: x2; var xmax = x1 > x2? x1: x2;
    var ys = (x1 == xmin)? y1:y2; var ye = (x1 == xmin)? y2:y1;      
    var dx = xmax-xmin; var dy = ye-ys; var m = dy/dx;
    
    // Initialize x and y: x and y will store the line with no perturbations
    var x = xmin; var y =  ys;  
    
    // Start drawing the line
    ctx.beginPath();
    ctx.moveTo(x,y);  
    for(; x<=xmax; x+=incr){
      incr = (Math.abs(x - xmin) < delta || Math.abs(x - xmax) < delta) ? 1: Math.PI/2;
      var xnew = x;
      
      // ynew uses the straight line, but perturbed by the sine
      var ynew = y + Math.sin(x*wavelength)*amplitude;    
      ctx.lineTo(xnew,ynew);
      y += (m*incr);
    }
  }
   
  ctx.stroke();
}

/* 
  Draws highlight box around selected body using the specified color
  The (optional) modifier is added to the width of the box
*/
function highlightSelection(body, color, modifier){
  // Special case: don't highlight origin
  if(bIndex(body) === 0) return;
  
  // Determine dimensions of the body being highlighted
  var bodyDim = body.aabb();
  var width = bodyDim.hw * 2;
  var height = bodyDim.hh * 2;
  var canvas = Globals.world.renderer();

  // Add some padding using either a default or the provided modifier
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
  
  // Draw a rectangle using appropriate coordinates
  canvas.ctx.lineWidth = 2;
  var centerX = bodyDim.x + Globals.translation.x - (width / 2);
  var centerY = bodyDim.y + Globals.translation.y - (height / 2);
  canvas.ctx.strokeRect(centerX, centerY, width, height);
}

/* 
  Draws a vector for each body with the option enabled
*/
function drawVectors(){
  var maxVx = 0; var maxVy = 0;
  var maxAx = 0; var maxAy = 0;
  
  // Loop through each body and determine maximum vector sizes for scaling
  var bodies = Globals.world.getBodies();
  for(var i=0; i < bodies.length; i++){
    if(Math.abs(bodies[i].state.vel.x) > maxVx) maxVx = Math.abs(bodies[i].state.vel.x);
    if(Math.abs(bodies[i].state.vel.y) > maxVy) maxVy = Math.abs(bodies[i].state.vel.y);
    var acceleration = totalAcceleration(bodies[i]);
    if(Math.abs(acceleration.x) > maxAx) maxAx = Math.abs(acceleration.x);
    if(Math.abs(acceleration.y) > maxAy) maxAy = Math.abs(acceleration.y);
  }
  
  // Draw the vectors, skipping over bodies with the option disabled
  for(var i=0; i < bodies.length; i++){
    if(!Globals.bodyConstants[i].vectors) continue;
    drawVectorLine(bodies[i], maxVx, maxVy, maxAx, maxAy);
  } 
}

/*
  Draws a Free Body Diagram and associated div with computed forces
*/
function drawFBD(){

  var selectedBody = Globals.selectedBody;

  // Toggle off the simulator, but note the fact that it needs to be resumed
  if(Globals.fbdDown && Globals.running) {
    Globals.fbdWasRunning = true;
    toggleSimulator();
  }

  // Handle (possibly) restarting the simulator and hiding the tooltip when finished
  if(!Globals.fbdDown || !selectedBody) {
    if(Globals.fbdWasRunning){
      toggleSimulator();
      Globals.fbdWasRunning = false;
    }

    $("#help-tooltip-fbd").hide();
    drawMaster();
    return;
  }

  // Only draw FBDs for point mass objects
  if(bodyType(selectedBody) !== "kinematics1D-mass") {
    return;
  }

  // Called to remove vectors from the selected body while displaying force vectors
  drawMaster();

  var canvas = Globals.world.renderer();
  var context = canvas.ctx;
  var bodySize = body2Constant(selectedBody).size;
  var fbdHelp = $("#help-tooltip-fbd");

  var mass = body2Constant(selectedBody).mass;

  // Compute force assigned by user
  var xInternalForce = selectedBody.state.acc.x * mass;
  var yInternalForce = selectedBody.state.acc.y * mass;

  // Compute force of gravity
  var xGlobalForce = Globals.gravity[0] * mass;
  var yGlobalForce = Globals.gravity[1] * mass;

  // Compute spring force
  var springForce = getSpringForce(selectedBody);
  var xSpringForce = springForce[0];
  var ySpringForce = springForce[1];
  
  // Compute magnitude of each force
  var totalInternalForce = Math.sqrt(Math.pow(xInternalForce, 2) + Math.pow(yInternalForce, 2)).toFixed(2);
  var totalGlobalForce = Math.sqrt(Math.pow(xGlobalForce, 2) + Math.pow(yGlobalForce, 2)).toFixed(2);
  var totalSpringForce = Math.sqrt(Math.pow(xSpringForce, 2) + Math.pow(ySpringForce, 2)).toFixed(2);

  // Limit length of vectors
  xInternalForce = clamp(-200, xInternalForce * 10, 200);
  yInternalForce = clamp(-200, yInternalForce * 10, 200);
  xGlobalForce = clamp(-200, xGlobalForce * 10, 200);
  yGlobalForce = clamp(-200, yGlobalForce * 10, 200);
  xSpringForce = clamp(-200, xSpringForce * 10, 200);
  ySpringForce = clamp(-200, ySpringForce * 10, 200);

  // Internal Force
  drawTipToTail(xInternalForce, yInternalForce, 'grey', 'grey', 'grey', false, selectedBody);

  // Global Force
  drawTipToTail(xGlobalForce, yGlobalForce, 'blue', 'blue', 'blue', false, selectedBody);
  
  // Spring Force
  drawTipToTail(xSpringForce, ySpringForce, 'orange', 'orange', 'orange', false, selectedBody);

  // Position the FBD popup window
  fbdHelp.html("<p style='color:grey'>" +
                  "Internal Force: " + totalInternalForce +
               "</p>" +
               "<p style='color:blue'>" +
                  "Global Force: " + totalGlobalForce +
              "</p>" +
               "<p style='color:orange'>" +
                  "Spring Force: " + totalSpringForce +
              "</p>"
              );

  var topPos = selectedBody.state.pos.y + Globals.translation.y + (bodySize/2) + 100;
  var leftPos = selectedBody.state.pos.x + Globals.translation.x + (bodySize/2) + 85;
  fbdHelp.css({top: topPos, left: leftPos});
  fbdHelp.show();
}

/* 
  Draw a vector for the specified body, scaled using the provided arguments 
*/
function drawVectorLine(body, maxVx, maxVy, maxAx, maxAy){
  var tipToTail = (body2Constant(body).vectors_ttt === true);
  maxVx = maxVx > 25? maxVx: 25;
  maxVy = maxVy > 25? maxVy: 25;
  maxAx = maxAx > 5? maxAx: 5;
  maxAy = maxAy > 5? maxAy: 5;
  
  // Scale vector sizes relative to maximum amount in simulator
  var vx_amt = (body.state.vel.x / maxVx) * 200.0;
  var vy_amt = (body.state.vel.y / maxVy) * 200.0;
  var acceleration = totalAcceleration(body);
  var ax_amt = ((acceleration.x) / maxAx) * 100.0;
  var ay_amt = ((acceleration.y) / maxAy) * 100.0;
  
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  ctx.lineWidth = 3;
  
  // Draw component-wise vectors
  if(!tipToTail)
  {  
  var x = body.state.pos.x + Globals.translation.x;
  var y = body.state.pos.y + Globals.translation.y;
  
  // x velocity
  if(vx_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(vx_amt) == 1)? '#00ff00': '#ff0000';    
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x + vx_amt, y);
    ctx.lineTo(x + vx_amt + -Math.sign(vx_amt)*0.1*Math.abs(vx_amt), y - 5); // Head of the arrow
    ctx.stroke();
  }

  // x acceleration
  if(ax_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(ax_amt) == 1)? '#009900': '#990000';
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x + ax_amt * 0.8, y);
    ctx.lineTo(x + ax_amt * 0.8 + -Math.sign(ax_amt)*0.1*Math.abs(ax_amt), y - 7);  // Head of the arrow
    ctx.lineTo(x + ax_amt * 0.8, y);
    ctx.lineTo(x + ax_amt, y);
    ctx.lineTo(x + ax_amt + -Math.sign(ax_amt)*0.1*Math.abs(ax_amt), y - 7);   // Second head
    ctx.stroke();
  }
  
  // y velocity
  if(vy_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(vy_amt) == 1)? '#ff0000': '#00ff00';
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x,y + vy_amt);
    ctx.lineTo(x - 5, y + vy_amt + -Math.sign(vy_amt)*0.1*Math.abs(vy_amt)); // Head of the arrow
    ctx.stroke();
  }
  
  // y acceleration
  if(ay_amt != 0)
  {
    ctx.strokeStyle = (Math.sign(ay_amt) == 1)? '#990000': '#009900';
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x,     y + 0.8*ay_amt);    
    ctx.lineTo(x - 5, y + 0.8*ay_amt + -Math.sign(ay_amt)*0.1*Math.abs(ay_amt));  // Head of the arrow
    ctx.lineTo(x,     y + 0.8*ay_amt);    
    ctx.lineTo(x, y + ay_amt);
    ctx.lineTo(x - 5, y + ay_amt + -Math.sign(ay_amt)*0.1*Math.abs(ay_amt));  // Second head
    ctx.stroke();
  }
  
  }
  
  // Draw tip-to-tail vector
  if(tipToTail)
  { 
    // Offset based on global camera translation
    var xOffset = body.state.pos.x + Globals.translation.x;
    var yOffset = body.state.pos.y + Globals.translation.y;   

    // If either velocity component is non-zero, draw the arrow
    if(vx_amt != 0 || vy_amt != 0)
      drawTipToTail(vx_amt, vy_amt, '#00ff00', '#ff0000', 'yellow', false, body);
    
    // If either acceleration component is non-zero, draw the arrow
    if(ax_amt != 0 || ay_amt != 0)
      drawTipToTail(ax_amt, ay_amt, '#009900', '#990000', 'yellow', true, body);    
  }
}

/*
  Return the angle formed by the line connecting 0,0 to the specified x,y coordinate in degrees
*/
function getAngle(x, y){ var result = -1 * rad2deg(Math.atan2(y, x)); return (result < 0)? result + 360: result;}
  
/*
  Returns a quadrant (1-4) indicating where an angle is located. The upper-left is quadrant 1 and they proceed CCW
*/  
function getQuadrant(angle) { 
  return (angle   >= 0 && angle <  90)? 1:
         (angle  >= 90 && angle < 180)? 2:
         (angle >= 180 && angle < 270)? 3: 4;
}

/*
  Draws a tip-to-tail vector using the specified x and y components, and colors
  Acc shoud be set to true to draw a double arrow, false for a single
  The arrows will begin from the specified body's coordinates
*/
function drawTipToTail(x, y, clr1, clr2, clr3, acc, body){
  var canvas = Globals.world.renderer();
  var ctx = canvas.ctx;
  ctx.lineWidth = 3;

  var angle = getAngle(x, y);      
  var quadrant = getQuadrant(angle);
  var color = (quadrant == 1)? clr1: (quadrant == 3)? clr2: clr3;
  var N  = magnitude(x, y) <= 20? 5: 15; // Size of the arrow head
  var THETA = (quadrant == 1 || quadrant == 4)?
                                              deg2rad(45) - deg2rad(angle):
                                              deg2rad(45) + deg2rad(angle);
  // Modify arrow offset based on angle
  var dx = N * Math.cos(THETA);
  var dy = N * Math.sin(THETA);

  // Invert delta values based on quadrant
  if(quadrant == 1) { dx *= -1; }
  if(quadrant == 2) { dx *= -1; dy *= -1; }
  if(quadrant == 3) { dx *= -1; dy *= -1; }
  if(quadrant == 4) { dx *= -1; } 

  ctx.strokeStyle = color;
  ctx.beginPath();
  
  // Find body coordinates and camera offset
  var bx = body.state.pos.x + Globals.translation.x;
  var by = body.state.pos.y + Globals.translation.y;
  
  // Draw the line
  ctx.moveTo(bx , by);
  ctx.lineTo(bx + x, by + y);
  ctx.lineTo(bx + x + dx, by + y - dy); // Draw the first arrow
  ctx.stroke();
  
  // Draw second tip to indicate acceleration if necessary
  if(acc){
    ctx.beginPath();
    ctx.moveTo(bx + x*0.9, by + y*0.9);
    ctx.lineTo(bx + x*0.9 + dx, by + y*0.9 - dy);
    ctx.stroke();
  }
}

/* 
  Copy current canvas into mini-canvas for keyframe n
  If n is false, use the previous keyframe
*/
function viewportToKeyCanvas(n){
  if(n === false) n = lastKF();  
  var canvas = $('#' + Globals.canvasId)[0].children[0];  
  
  // Find the appropriate mini-canvas and copy the data from the main canvas
  var keycanvas = $("#keyframe-" + n)[0];
  if(keycanvas != undefined)
  {
    keycanvas.getContext('2d').clearRect(0, 0, keycanvas.width, keycanvas.height);
    keycanvas.getContext('2d').drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, keycanvas.width, keycanvas.height);
  }
}

/*
  Adds post world.render() effects including property windows, vectors, and highlights
  Anything drawn in this function will be layered over the PhysicsJS rendering effects
*/
function postRender(isKeyframe){
  var selectedBody = Globals.selectedBody;
  var originObject = Globals.originObject;
  
  // Only draw vectors if we aren't currently looking at a FBD
  if(!Globals.fbdDown || !selectedBody) {
    drawVectors();
  }

  // If a body is selected, hide all HTML elements in the properties tab,
  // but then unhide any matching types
  if (selectedBody) {    
    var bodConstants = Globals.bodyConstants[bIndex(selectedBody)];
    $('#general-properties').addClass('hide');
    $('#pointmass-properties').addClass('hide');
    $('#surface-properties').addClass('hide');
    $('#ramp-properties').addClass('hide');
    $('#spring-properties').addClass('hide');
    $('#general-properties').removeClass('hide');

    switch (bodConstants.ctype) {
      case 'kinematics1D-mass':
        $('#pointmass-properties').removeClass('hide');
        break;
      case 'kinematics1D-surface':
        $('#surface-properties').removeClass('hide');
        break;
      case 'kinematics1D-ramp':
        $('#ramp-properties').removeClass('hide');
        break;
      case 'kinematics1D-spring':
      case 'kinematics1D-spring-child':
        $('#spring-properties').removeClass('hide');
        break;
    }
  } else {
    // If no body is selected, hide all HTML elements in the properties tab
    $('#general-properties').addClass('hide');
    $('#pointmass-properties').addClass('hide');
    $('#surface-properties').addClass('hide');
    $('#ramp-properties').addClass('hide');
    $('#spring-properties').addClass('hide');
  }

  // For keyframes, copy the canvas to a mini-canvas and display canonical variable values
  if(isKeyframe){
    viewportToKeyCanvas(Globals.keyframe);
    displayVariableValues(selectedBody); 
  }
  else {
    // Otherwise just display the approximate values
    displayElementValues(selectedBody);
  }
  
  // Highlight the selected body
  if(selectedBody)
    highlightSelection(selectedBody);

  // If the origin is attached to an object, highlight it in green
  if (originObject !== false) {
    highlightSelection(Globals.world.getBodies()[originObject], '#00ff00', -10);
  }
  
  // Draw y grid labels
  var can = Globals.world.renderer();
  var incr = 50/getScaleFactor();
  var ymod = Math.floor(Globals.translation.y/incr)*incr;
  if(ymod < 0 && Globals.translation.y !== ymod) ymod += incr;  
  for(var i=-100; i <= can.height+100; i+= incr)    
    can.ctx.fillText("  " + (swapYpos(i, false) + ymod)*getScaleFactor(), 0, (i + Globals.translation.y % incr));
  
  // Draw x grid labels
  var xmod = Math.floor(Globals.translation.x/incr)*incr;
  if(xmod < 0 && Globals.translation.x !== xmod) xmod += incr;
  for(var i=-100; i <= can.width+100; i+= incr){  
    if(Globals.scale < 0 && i%(incr*2)==0) continue; // Skip every other box when zoomed in
    can.ctx.fillText("" + (i - xmod)*getScaleFactor(), (i + Globals.translation.x % incr), can.height - 10, incr);
  }
}

/*
  Draws a blue highlight around the nth mini-keyframe canvas
  If n is not false, highlights keyframe n.
  If n is false, this will either:
    1) remove all highlights (if color is falsy)
    2) draw a highlight on the PREVIOUS keyframe (if color is not falsy)
*/
function highlightKeycanvas(n, color){
  // Remove highlight on all keyframes
  for(var i=0; i < Globals.numKeyframes; i++)
    $("#" + "keyframe-" + i).attr("style","");
  
  // Add highlight to nth keyframe if
  if(n !== false)
    $("#" + "keyframe-" + n).attr("style","border:4px solid #0000cc");  
  else if(n === false && color)
    $("#" + "keyframe-" + lastKF()).attr("style","border:4px solid " + color);  
}

/*
  Draws effects rendered before the PhysicsJS world, including grid lines, springs, and ropes
*/
function preRender(){
  var can = Globals.world.renderer();
  
  // Determine increment to create boxes 50 canonical units across
  var incr = 50/getScaleFactor();
  
  // Draw vertical grid lines
  for(var i=-100; i <= can.width + 100; i+= incr)
    can.drawLine({'x':(i + Globals.translation.x % incr), 'y':0},
                 {'x':(i + Globals.translation.x % incr), 'y':can.height},
                 { strokeStyle: '#eeeeee',lineWidth: 1});

  // Draw horizontal grid lines
  for(var i=-100; i <= can.height+100; i+= incr)
    can.drawLine({'x':0,         'y':(i + Globals.translation.y % incr)},
                 {'x':can.width, 'y':(i + Globals.translation.y % incr)},
                 { strokeStyle: '#eeeeee',lineWidth: 1});

  // Draw ropes and springs (so they appear behind components)
  drawLines();
}

/* 
  Sets the world state to the currently selected frame and renders it
*/
function drawMaster(){
  
  // Avoid rendering while loading
  if(Globals.loading) {
    return;
  }

  var world = Globals.world;
  var frame = Globals.frame;
  var keyframe = Globals.keyframe;
  
  // Clear the canvas (done manually to allow for prerender step)
  Globals.world.renderer().ctx.clearRect(0, 0, Globals.world.renderer().width, Globals.world.renderer().height);

  // Set the state of each object to match a keyframe or standard frame
  if(keyframe !== false){
    setStateKF(keyframe);  
  }
  else if(frame !== false) {
    setState(frame);  
  } 
  
  // Perform all rendering steps
  preRender();    
  world.render();
  postRender(Globals.keyframe !== false);  
}

/*
  zoom == +1 -> Zoom in one tick
  zoom == -1 -> Zoom out one tick
  otherwise  -> Do nothing
  
  The simulation is redone since zooming actually must modify coordinates within PhysicsJS to work
*/
function simulationZoom(zoom) {
  
  // Adjust scale factor if within limits
  if (zoom > 0 && Globals.scale < Globals.maxScale) {
    Globals.scale += 1;
  } else if (zoom < 0 && Globals.scale > Globals.minScale) {
    Globals.scale -= 1;
  } else {
    return;
  }

  // Camera is reset to origin
  Globals.translation.x = 0;
  Globals.translation.y = 0;

  // Rescale and bias images
  var factor = (zoom < 0)? 0.5: 2.0;
  var numBodies = Globals.world.getBodies().length;
  for(var i=0; i < numBodies; i++){
    
    var body = Globals.world.getBodies()[i];
    var bodyConst = body2Constant(body);
    if (bodyConst.ctype == "kinematics1D-mass" || bodyConst.ctype == "kinematics1D-pulley") {
      updateImage(body, bodyConst.img);
      updateSize(body, bodyConst.size);      
    } else if (bodyConst.ctype == "kinematics1D-surface") {
      setSurfaceWidth(body, bodyConst.surfaceWidth);
      setSurfaceHeight(body, bodyConst.surfaceHeight);
    } else if (bodyConst.ctype == "kinematics1D-ramp") {
      setRampWidth(body, bodyConst.rampWidth, true);
      setRampHeight(body, bodyConst.rampHeight, true);
    }
        
    // Scale within existing keyframe states
    for(var j=0; j < Globals.keyframeStates.length; j++){
      var state = Globals.keyframeStates[j][bIndex(body)];
      state.pos.x *= factor;
      state.pos.y = swapYpos(swapYpos(state.pos.y, false) * factor, false);
    }
    
    // Scale within existing simulation states
    if(Globals.states[i])
      for(var j=0; j < Globals.states[i].length; j++){
        var state = Globals.states[i][j];
        state.pos.x *= factor;
        state.pos.y = swapYpos(swapYpos(state.pos.y, false) * factor, false);
      }
  }
  
  // Resimulate using scaled values and redraw the first frame
  attemptSimulation();
  drawMaster();
}

/*
  Colors the toolbox items according to whether restricted items are allowed (enable == true)
  or not (enable == false); also sets whether the toolbox items are draggable or not
*/
function colorToolbox(enable){
  var restricted = $(".restricted");
  if(enable){
    // Color the restricted items green, add draggable/clickable class
    restricted.css("background", "");
    for(var i=0; i<restricted.length; i++){
      $(restricted[i].children[1].children[0]).addClass("draggable clickable ui-draggable ui-draggable-handle");
      $(restricted[i].children[1].children[0]).off('dragstart');
    }
  }
  else {
    // Color the restricted items red, remove draggable/clickable class    
    restricted.css("background", "#998");
    for(var i=0; i<restricted.length; i++){
      $(restricted[i].children[1].children[0]).removeClass("draggable clickable ui-draggable ui-draggable-handle");
      $(restricted[i].children[1].children[0]).on('dragstart', function(event) { event.preventDefault(); });
    }
  }
}
