/*
  kinematics.js -- 
  This file defines the primary kinematics modules utilizing the keyframe system
*/
function Kinematics1DModule() {

  /*
    Handles initializing the world; A world is a PhysicsJS object containing bodies, interactions,
    and default behaviors
  */
  function initWorld() {
    return Physics(function (world) {
      var canvasId = "viewport";
      var canvasEl = document.getElementById(canvasId);
      var viewportBounds = Physics.aabb(0, 0, canvasEl.clientWidth, canvasEl.clientHeight); // bounds of the window
      var edgeBounce;
      var renderer;
      var integrator;
      
      var variableMap = Globals.variableMap;
      var bodyConstants = Globals.bodyConstants;
      
      // Default dt per frame
      world.timestep(0.5);
            
      // Create a renderer
      renderer = Physics.renderer('canvas', {el: canvasId, manual: true});      
      
      // Add the renderer
      world.add(renderer);
    
      // Add our custom integrator
      integrator = Physics.integrator('principia-integrator', {});
      world.add(integrator);

      // Add the PhysicsJS origin, which will always be the 0th body of a simulation
      // Image used for origin object
      var img = document.createElement("img");
      img.setAttribute("src", "/static/img/toolbox/origin.png");
      img.setAttribute("width", "20");
      img.setAttribute("height", "20");
      bodyConstants.push({ctype:"kinematics1D-origin"});
      variableMap[0].push({});
      var origin = Physics.body('circle', {
                treatment:"ghost",
                x: Globals.origin[0],
                y: swapYpos(Globals.origin[1], false),
                radius: 25,
                view: img,
                styles: {
                  fillStyle: '#4d4d4d',
                  angleIndicator: '#ffffff'
                }
              });
      world.add(origin);
      Globals.keyframeStates[0].push(cloneState(origin.state));
      
      
      /*
        The addComponent interactions allows users to specify a type of body
        and pixel coordinates where it was dropped to add it to the world
      */
      world.on('addComponent', function(data) {
        
        // Basic prevention of adding too many bodies (but allow simulations saved beyond the limit to still load)
        if(Globals.world.getBodies().length >= Globals.maxNumBodies && !Globals.loading){
          failToast("Too many bodies.");
          return;
        }
        
        // Save the keyframe to return to after redrawing all frames
        var originalKeyframe = Globals.keyframe;
        
        // Beyond one keyframe, several components are not allowed;
        // they will be added once the solver can handle their behavior
        if(Globals.numKeyframes > 1){
          if(data.type == "kinematics1D-surface" ||
             data.type == "kinematics1D-spring" ||
             data.type == "kinematics1D-pulley" ||
             data.type == "kinematics1D-ramp"){
               return;
             }
        }
        
        // Tranform provided pixel coordinates into canonical coordinates
        // A canonical coordinate represents the abstract location of a body
        // without respect to any camera scaling/panning on the part of the user
        var canon = canonicalTransform(data);
        data.x = canon.x; // Replace pixel coordinates in the data object with canonical ones
        data.y = canon.y;
        
        // Create a new body based on the type of the provided data
        switch(data.type){
          
          // Handle springs and their child element
          case "kinematics1D-spring":         
            bodyConstants.push({ctype:data.type});
            bodyConstants.push({ctype:data.type + "-child"});
            addSpring(data);
            break;
            
          // Fall-through case that handles square and round point masses:
          case "kinematics1D-squaremass":
            data.massType = "square";
          case "kinematics1D-roundmass":
            if (data.massType === undefined)
              data.massType = "round";
          case "kinematics1D-mass":
            bodyConstants.push({ctype:"kinematics1D-mass"});
            addMass(data, data.massType);
            break;
          
          // Handle surfaces, ramps, and pulleys:
          case "kinematics1D-surface":
            bodyConstants.push({ctype:data.type});
            addSurface(data);
            break;
          case "kinematics1D-ramp":
            bodyConstants.push({ctype:data.type});
            addRamp(data);
            break;
          case "kinematics1D-pulley":
            bodyConstants.push({ctype:data.type});
            addPulley(data);
            break;
          
          // Special case: Handle moving (rather than adding) the origin
          case "kinematics1D-origin":
            moveOrigin(data, true);
            break;
        }

        // Immediately resimulate if there is a single keyframe
        if(Globals.numKeyframes === 1) attemptSimulation();
        
        // Restore the keyframe state and highlight, redraw the current frame
        Globals.keyframe = originalKeyframe;
        highlightKeycanvas(Globals.keyframe);
        drawMaster();
      });

      // Resize events
      window.addEventListener('resize', function () {
        // as of 0.7.0 the renderer will auto resize... so we just take the values from the renderer
        
        // The bodies will have to be shifted vertically based on how the window was resized
        var dy = renderer.height - viewportBounds.y*2;
        var bodies = Globals.world.getBodies();
        for(var i=0; i < bodies.length; i++){
          bodies[i].state.pos.y += dy;
        }
                
        viewportBounds = Physics.aabb(0, 0, renderer.width, renderer.height);

        // Redraw the frame
        drawMaster();
      }, true);
   
      // Note: PhysicsJS zeroes out velocity on grab (ln 8445) - commented out for our simulator

      /*
        Handles grabbing an object within the canvas
      */
      world.on('interact:grab', function( data ){ 
        //hide context menu
        toggleMenuOff();
         
        // Grabbed a body...
        var index = bIndex(data.body);
        if(data.body && index !== 0){
          selectBody(bIndex(data.body), bIndex(data.body) === 0); // Only switch tabs if not the origin!
        }

        if (index === 0 && !($("#globalprops-tab").hasClass("active-side-menu-item"))) {
          $("#globalprops-tab").click();
        }
      });
  
      /*
        Handles moving an object within the canvas
      */
      world.on('interact:move', function( data ){        

        if(Globals.vChanging){      
          // Prevent non-panning move interactions on standard frames if multiple keyframes exist
          if(Globals.numKeyframes > 1 && Globals.keyframe === false){
            return;
          }
          updateVector(data);   // Handle vector hotkeys
        }
        
        // Prevent other move events until 200 ms after canvas is clicked
        if(!Globals.mouseDown) return;
        var elapsed = new Date() - Globals.mouseDown;
        if(elapsed < 200)
          return;
        
        if (Globals.isPanning)
          panZoomUpdate(data);  // Handle panning
        if(data.body && !Globals.vChanging && !Globals.isPanning) {
          // Prevent non-panning move interactions on standard frames if multiple keyframes exist
          if(Globals.numKeyframes > 1 && Globals.keyframe === false){
            return;
          }
          Globals.didMove = true;
          setNoSelect(true);
          var index = bIndex(data.body);       
                      
          // Assign canonical coordinates to the body
          var canon = canonicalTransform(data);                    
          onPropertyChanged(index, "posx", canon.x, false);
          onPropertyChanged(index, "posy", canon.y, false);

          // Special case: Deal with the origin
          if(index === 0 || index === Globals.originObject)
            moveOrigin({"x":canon.x, "y":canon.y}, false);
          
          // Draw the frame
          drawMaster();
        }
      });
  
      /*
        Handles releasing the canvas
      */
      world.on('interact:release', function( data ){         
        $('body').css({cursor: "auto"});
        Globals.isPanning = false;
        
        // Delete the mouseDown time and wait for next click
        if(Globals.mouseDown) 
          delete Globals.mouseDown;
        
        // Prevent release interaction on standard frames if multiple keyframes exist
        if(Globals.numKeyframes > 1 && Globals.keyframe === false){
          return;
        }
        
        // Note that PhysicsJS adds to velocity vector upon release - commented out for our simulator
        if(data.body && Globals.didMove && !Globals.vChanging){
            
            // Make move as complete
            Globals.didMove = false;
            setNoSelect(false);
            var index = bIndex(data.body);
            
            // Update final position of body with canonical coordinates
            var canon = canonicalTransform(data);
            onPropertyChanged(index, "posx", canon.x, false);
            onPropertyChanged(index, "posy", canon.y, false);
            
            // Handle moving objects attached to pulley
            if(bodyType(data.body) == "kinematics1D-pulley")
              movePulley(data);
            
            // Handle forming/breaking any attachments
            if(bodyType(data.body) == "kinematics1D-mass" || bodyType(data.body) == "kinematics1D-spring-child")
            {
              detachSpring(data.body);
              attachSpring(data.body);
              attachPulley(data.body);
              snapToPulley(data.body);
            }
            
            // Handle moving the origin
            if(index === 0 || index === Globals.originObject)
              moveOrigin({"x":canon.x, "y":canon.y}, false);
          
            // Resimulate if there is only one keyframe
            if(Globals.numKeyframes == 1) attemptSimulation();
            
            // Draw the frame
            drawMaster();
        }
      });

      /*
        Handle tapping the world when there is no body
      */
      world.on('interact:poke', function(data){    
        
        // Remove context menu
        toggleMenuOff();
        Globals.lastPos.x = data.x;
        Globals.lastPos.y = data.y;
        
        // Handle panning
        $('body').css({cursor: "move"});
        Globals.isPanning = true;

        // Deselect any active body
        Globals.selectedBody = false;  
        
        // Draw the frame
        drawMaster();

        if ($("#elementprops-tab").hasClass("active-side-menu-item") || $("#globalprops-tab").hasClass("active-side-menu-item"))
          rightSlideMenuClose();
      });
    
      // add things to the world
      world.add([
        Physics.behavior('interactive', {el: renderer.container}),       
        Physics.behavior('body-impulse-response'),
        Physics.behavior('body-collision-detection'),
        Physics.behavior('sweep-prune'),
        edgeBounce
        ]);
      });
} // end initWorld

  /*
    Initializes this module, using the specified JSON to restore state if necessary
  */
  function initModule(json) {
    
    // Use the init world function to construct the world and its behavior
    Globals.world = initWorld();
            
    // How the solver object works:
    // Try to assign a value to each key using known variables
    // Repeat until no new values can be assigned
    // Note that an overconstrained problem could still be solved with this method, leading to unsound results
    Globals.solver = new Solver(
    {
      xf:
      {
        name:'$x_f$',
        eq:['x0 + vx0*t + 0.5*ax*t^2'],
        pretty:[' using the kinematic equation $x_f = x_0 + {v_x}_0*t + 1/2*a_x*t^2$ '], 
        vars:[['x0','vx0','ax','t']],
        prettyvars:[['$x_0$', '${v_x}_0$', '$a_x$', '$t$']]
      },
      
      yf:
      {
        name:'$y_f$',
        eq:['y0 + vy0*t + 0.5*ay*t^2'],
        pretty:[' using the kinematic equation $y_f = y_0 + v_y*t + 1/2*a_y*t^2$ '], 
        vars:[['y0','vy0','ay','t']],
        prettyvars:[['$y_0$', '${v_y}_0$', '$a_y$', '$t$']]
      },
      
      vxf:
      {
        name:'${v_x}_f$',
        eq:['vx0 + ax*t'],
        pretty:[' using the kinematic equation ${v_x}_f = v_x + a_x*t$ '],
        vars:[['vx0','ax','t']],
        prettyvars:[['${v_x}_0$','$a_x$','$t$']]
      },
      
      vyf:
      {
        name:'${v_y}_f$',
        eq:['vy0 + ay*t'],
        pretty:[' using the kinematic equation ${v_y}_f = v_y + a_y*t$ '],
        vars:[['vy0','ay','t']],
        prettyvars:[['${v_y}_0$','$a_y$','$t$']]
      },
      
      vx0:
      {
        name:'${v_x}_0$',
        eq:['vxf-ax*t'],
        pretty:[' rearranging the kinematic equation ${v_x}_f = v_x + a*t$'],
        vars:[['vxf','ax','t']],
        prettyvars:[['${v_x}_f$','$a_x$','$t$']]
      },
      
      vy0:
      {
        name:'${v_y}_0$',
        eq:['vyf-ay*t'],
        pretty:[' rearranging the kinematic equation ${v_y}_f = v_y + a_y*t$'],
        vars:[['vyf','ay','t']],
        prettyvars:[['${v_y}_f$','$a_y$','$t$']]
      },
      
      x0:
      {
        name:'$x_0$',
        eq:['xf-vx0*t-0.5*ax*t^2'],
        pretty:[' rearranging the kinematic equation $x_f = x + v_x*t + 1/2 a_x*t^2$ '],
        vars:[['xf','vx0','t','ax']],
        prettyvars:[['$x_f$','${v_x}_0$','$t$','$a_x$']]
      },
      
      y0:
      {
        name:'${y_0}_f$',
        eq:['yf-vy0*t-0.5*ay*t^2'],
        pretty:[' rearranging the kinematic equation $y_f = y + v_y*t + 1/2 a_y*t^2$ '],
        vars:[['yf','vy0','t','ay']],
        prettyvars:[['$y_f$','${v_y}_0$','$t$','$a_y$']]
      },
      
      t:
      {
        name:'$t$',
        eq:['(vxf-vx0)/ax', '(vyf-vy0)/ay', '(sqrt(2*yf*ay - 2*y0*ay + vy0^2) - vy0)/ay'],
        pretty:[' rearranging the kinematic equation ${v_x}_f = {v_x}_0 + a_x*t$ ', ' rearranging the kinematic equation ${v_y}_f = {v_y}_0 + a_y*t$ ', ' using the kinematic equation $y_f - y_0 = v_0*t + 1/2 a t^2$  '],
        vars:[['vxf','vx0','ax'],['vyf','vy0','ay'],['yf','ay','y0','vy0']],
        prettyvars:[['${v_x}_f$','${v_x}_0$','$a_x$'],['${v_y}_f$','${v_y}_0$','$a_y$'],['$y_f$','$a_y$','$y_0$','${v_y}_0$']]
      },
      
      ax:
      {
        name:'$a_x$',
        eq:['(vxf-vx0)/t'],
        pretty:[' rearranging the kinematic equation ${v_x}_f = v_x + a_x*t$ '],
        vars:[['vxf','vx0','t']],
        vars:[['${v_x}_f$','${v_x}_0$','$t$']]
      },
      
      ay:
      {
        name:'$a_y$',
        eq:['(vyf-vy0)/t'],
        pretty:[' rearranging the kinematic equation ${v_y}_f = v_y + a_y*t$ '],
        vars:[['vyf','vy0','t']],
        prettyvars:[['${v_y}_f$','${v_y}_0$','$t$']]
      }       
    });
    
    // Do initial render of origin after the image loads
    if(Globals.world.getBodies()[0].view.complete)
      drawMaster();
    else
      Globals.world.getBodies()[0].view.onload = function() { drawMaster(); };
    
     // If there is no JSON, the rest can be skipped
     if(!json || json == "{}")
      return;
    
    // Otherwise, raise the loading flag and start restoring state:
    Globals.loading = true;    
    var restore = $.parseJSON(json);
    
    // Most keys can be assigned directly to the appropriate global
    for(var key in restore)
    {
      if(key == "keyframeStates") continue;
      if(key == "bodyConstants") continue;
      if(key == "origin") continue;
      Globals[key] = restore[key];
    }
    
    // Stringified keyframes don't interact well with PhysicsJS
    // Solution: Add the real component to get PhysicsJS state object
    // Then transfer tempKF values to corresponding "real" keyframe
    var tempKF = restore.keyframeStates;
    var tempBC = restore.bodyConstants;
    
    // Add keyframes
    for(var i=0; i<tempKF.length-1; i++)
      addKeyframe();
    
    // Get canonical values from saved variable map
    Globals.variableMap = restore.variableMap;
    
    // Add all non-origin bodies back to world
    for(var i=1; i<tempBC.length; i++)
    {
      var type = tempBC[i].ctype;      
      var x = tempKF[0][i].pos._[0];      
      var y = 0;
      var data = { 'type': type, 'x': x, 'y': y, 'blockSimulation':true};

      if (tempBC[i].massType !== undefined)
        data.massType = tempBC[i].massType;

      if(type != "kinematics1D-spring-child")
        Globals.world.emit('addComponent', data);
      Globals.bodyConstants[i] = tempBC[i];

      Globals.selectedBody = Globals.world.getBodies()[Globals.world.getBodies().length-1];
      var index = Globals.world.getBodies().length-1;
      if (type == "kinematics1D-mass" || type == "kinematics1D-pulley") {
        updateImage(Globals.selectedBody, tempBC[i].img);
        updateSize(Globals.selectedBody, tempBC[i].size);
      } else if (type == "kinematics1D-surface") {
        setSurfaceWidth(Globals.selectedBody, tempBC[i].surfaceWidth);
        setSurfaceHeight(Globals.selectedBody, tempBC[i].surfaceHeight);
        setSurfaceFriction(Globals.selectedBody, tempBC[i].surfaceFriction);
      } else if (type == "kinematics1D-ramp") {
        setRampWidth(Globals.selectedBody, tempBC[i].rampWidth, true);
        setRampHeight(Globals.selectedBody, tempBC[i].rampHeight, true);
        setRampAngle(Globals.selectedBody, tempBC[i].rampAngle);
        setRampFriction(Globals.selectedBody, tempBC[i].rampFriction);
      }
      Globals.selectedBody = false;
    }
    
    // Restore keyframe states. Note the use of the variable map to get canonical y values and swap to match new canvas size
    for(var i=0; i<tempKF.length; i++)
      for(var j=0; j<tempKF[i].length; j++)
      {        
        var KF = tempKF[i][j];
        Globals.keyframeStates[i][j].pos.x = KF.pos._[0];        
        Globals.keyframeStates[i][j].pos.y = swapYpos(Globals.variableMap[i][j].posy, false);
        Globals.keyframeStates[i][j].vel.x = KF.vel._[0];
        Globals.keyframeStates[i][j].vel.y = KF.vel._[1];
        Globals.keyframeStates[i][j].acc.x = KF.acc._[0];
        Globals.keyframeStates[i][j].acc.y = KF.acc._[1];
        var angular = KF.angular;
        Globals.keyframeStates[i][j].angular = {acc:angular.acc,vel:angular.vel,pos:angular.pos};
      }
      
      // Restore the origin
      moveOrigin({"x":restore["origin"][0], "y":restore["origin"][1]});
      Globals.originObject = restore.originObject;
      if(Globals.originObject !== false)
        Globals.world.getBodies()[0].hidden = true;
      
    // Draw for each keyframe to prep mini-canvases
    for(var i=tempKF.length-1; i>=0; i--){
      Globals.keyframe = i;
      drawMaster();
    }
    
    // Restore coordinate system
    updateCoords(Globals.coordinateSystem);
    if(Globals.coordinateSystem == "polar"){
      $("#coord-sys").children()[1].removeAttribute("selected");
      $("#coord-sys").children()[2].setAttribute("selected", "selected");
    }
    
    // Resimulate if necessary
    if(Globals.timelineReady)
      simulate();

    // Done loading
    Globals.loading = false;
    
    // Do final rendering of first frame
    highlightKeycanvas(0);
    Globals.keyframe = 0;
    setStateKF(0);
    updateRangeLabel();
    drawMaster();
  }
  
  /*
    Update the timestep that passes between each frame
  */
  function setDt(dt) { Globals.world.timestep(dt); }

  /*
    Handles updating vectors via the mouse instead of typing in a value
  */
  function updateVector(data) {
    var body = Globals.selectedBody;   
    if(body){
      
        // Update within a keyframe
        if(Globals.keyframe === false) {
          var frame = lastKF();
          setStateKF(frame);
          Globals.keyframe = frame;
          highlightKeycanvas(Globals.keyframe);
        }
      
        var index = bIndex(body);
        
        // Find how far the cursor is from the body
        var dx = (-body.state.pos.x - Globals.translation.x + data.x) / 8;
        var dy = (-body.state.pos.y - Globals.translation.y + data.y) / 8;
        
        // Rounds number to nearest increment of 0.25
        var snapTo = function(n) { return (Math.round(n*4)/4).toFixed(2); };
        
        // Snap dx and dy to an increment
        dx = snapTo(dx);
        dy = snapTo(dy);
        
        // Adjust the velocity vector
        if(Globals.vDown){
          body.state.vel.x = dx;
          body.state.vel.y = dy;
          onPropertyChanged(index, "velx", dx, false);
          onPropertyChanged(index, "vely", dy, false);
        }
        
        // Adjust the acceleration vector
        if(Globals.aDown){
          body.state.acc.x = dx;
          body.state.acc.y = dy;
          onPropertyChanged(index, "accx", dx, false);
          onPropertyChanged(index, "accy", dy, false);
        }

        // Draw the frame
        drawMaster();
      }
  }
  
  return {
    initWorld:  initWorld,
    initModule: initModule,    
    setDt:    setDt
  };
}

var Kinematics1D = Kinematics1DModule();
