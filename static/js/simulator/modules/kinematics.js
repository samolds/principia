/*
  kinematics.js -- 
  This file defines the primary kinematics modules utilizing the keyframe system.
*/

function Kinematics1DModule() {

function initWorld() {
    return Physics(function (world) {
      var canvasId = "viewport";
      var canvasEl = document.getElementById(canvasId);
      var viewportBounds = Physics.aabb(0, 0, canvasEl.clientWidth, canvasEl.clientHeight);// bounds of the window
      var edgeBounce;
      var renderer;
      var integrator;    
      
      var variableMap = Globals.variableMap;
      var bodyConstants = Globals.bodyConstants;
      
      world.timestep(0.1); // TODO: should base timestep on dt option
            
      // create a renderer
      renderer = Physics.renderer('canvas', {el: canvasId});

      // add the renderer
      world.add(renderer);
    
      // add our custom integrator
      integrator = Physics.integrator('principia-integrator', {});
      world.add(integrator);

      // Default image: use pointmass image. Can be changed from select element.
      var img = document.createElement("img");
      img.setAttribute("src", "/static/img/toolbox/origin.png");
      img.setAttribute("width", "20");
      img.setAttribute("height", "20");
  
      // Add the PhysicsJS origin
      bodyConstants.push({ctype:"kinematics1D-origin"});
      variableMap[0].push({});
      var origin = Physics.body('circle', {
                treatment:"ghost",
                x: Globals.origin[0],
                y: Globals.origin[1],
                radius: 25,
                view: img,
                styles: {
                  fillStyle: '#4d4d4d',
                  angleIndicator: '#ffffff'
                }
              });
              
      world.add(origin);
      Globals.keyframeStates[0].push(cloneState(origin.state));
      
      world.on('addComponent', function(data) {
               
        bodyConstants.push({ctype:data.type});
        
        switch(data.type){
          case "kinematics1D-spring":         
            bodyConstants.push({ctype:data.type + "-child"});
            addSpring(data);
            break;
          case "kinematics1D-mass":
            addMass(data);
            break;
          case "kinematics1D-ramp":
            addRamp(data);
            break
          case "kinematics1D-pulley":
            addPulley(data);
            break;
          case "kinematics1D-origin":
            moveOrigin(data);
            break;
        }
    
        drawMaster();
      });
  
      // constrain objects to these bounds
      edgeBounce = Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds,
        restitution: 0.99,
        cof: 0.8
      });

      // resize events
      window.addEventListener('resize', function () {
        // as of 0.7.0 the renderer will auto resize... so we just take the values from the renderer
        viewportBounds = Physics.aabb(0, 0, renderer.width, renderer.height);        
        edgeBounce.setAABB(viewportBounds); // update the boundaries
        drawMaster();
      }, true);
   
      // Note: PhysicsJS zeroes out velocity (ln 8445) - commented out for our simulator    
      world.on('interact:grab', function( data ){        
        if(data.body){          
          selectBody(bIndex(data.body), bIndex(data.body) !== 0); // Only switch tabs if not the origin!
        }
      });
  
  world.on('interact:move', function( data ){
    if(data.body) {
            
      if(bIndex(data.body) === Globals.originObject || bIndex(data.body) === 0)
      {
        Globals.origin = [data.x, data.y];
        $("#glob-xorigin").val(data.x) ; 
        $("#glob-yorigin").val(data.y) ;
      }
      
      Globals.didMove = true;
      onPropertyChanged("posx", data.x);          
      onPropertyChanged("posy", data.y);
      
      if(bIndex(data.body) === 0){        
        document.getElementById("globalprops-tab").click();
      }
        
      drawMaster();
    }
  });
  
  world.on('interact:release', function( data ){    
    // Note that PhysicsJS adds to velocity vector upon release - commented out for our simulator
    if(data.body && Globals.didMove){
        
        // Make move as complete
        Globals.didMove = false;

        // Resimulate if there is only one keyframe
        onPropertyChanged("posx", data.x);
        onPropertyChanged("posy", data.y);
        
        if(Globals.bodyConstants[bIndex(data.body)].ctype == "kinematics1D-mass")
        {
          attachSpring(data.body);
          detachSpring(data.body);
          attachPulley(data.body);          
        }
        
        if(Globals.bodyConstants[bIndex(data.body)].ctype == "kinematics1D-origin")
          moveOrigin({"x":data.x, "y":data.y});

        drawMaster();
    }
  });
  
  world.on('interact:poke', function( data ){        
    Globals.selectedBody = false;
    document.getElementById("toolbox-tab").click();
    drawMaster();
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

  function initModule(json) {
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
        pretty:[' using the kinematic equation y_f = y_0 + v_y*t + 1/2*a_y*t^2 '], 
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
        pretty:[' rearranging the kinematic equation {v_x}_f = v_x + a*t'],
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
        prettyvars:[['${v_x}_f$','${v_x}_0$','$a_x$'],['${v_y}_f$','${v_y}_0$','$a_y$'],['yf','ay','y0','vy0']]
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
    
    drawMaster();
    
     if(!json || json == "{}")
      return;
    
    var restore = $.parseJSON(json);
    for(var key in restore)
    {
      if(key == "keyframeStates") continue;
      if(key == "bodyConstants") continue;
      if(key == "origin") continue;
      Globals[key] = restore[key];
    }
    
    // Stringified keyframes don't interact well with PhysicsJS
    // Solution: Add the real component to get PhysicsJS state object
    // Then transfer tempKF values to real corresponding "real" keyframe
    var tempKF = restore.keyframeStates;
    var tempBC = restore.bodyConstants;
    
    for(var i=0; i<tempKF.length-1; i++)
    {
      addKeyframe();
    }
    
    for(var i=1; i<tempBC.length; i++)
    {
      var type = tempBC[i].ctype;      
      var x = tempKF[0][i].pos._[0];
      var y = tempKF[0][i].pos._[1];
      var data = { 'type': type, 'x': x, 'y': y, 'blockSimulation':true};
      if(type != "kinematics1D-spring-child")
        Globals.world.emit('addComponent', data);
      Globals.bodyConstants[i] = tempBC[i];

      Globals.selectedBody = Globals.world.getBodies()[Globals.world.getBodies().length-1];
      if (type == "kinematics1D-mass" || type == "kinematics1D-pulley") {
        onPropertyChanged("image", tempBC[i].img, false);
        onPropertyChanged("size", tempBC[i].size, false);
      } else if (type == "kinematics1D-ramp") {
        onPropertyChanged("width", tempBC[i].width, false);
        onPropertyChanged("height", tempBC[i].height, false);
      }
      Globals.selectedBody = false;
    }
    
    for(var i=0; i<tempKF.length; i++)
      for(var j=0; j<tempKF[i].length; j++)
      {        
        var KF = tempKF[i][j];
        Globals.keyframeStates[i][j].pos.x = KF.pos._[0];
        Globals.keyframeStates[i][j].pos.y = KF.pos._[1];
        Globals.keyframeStates[i][j].vel.x = KF.vel._[0];
        Globals.keyframeStates[i][j].vel.y = KF.vel._[1];
        Globals.keyframeStates[i][j].acc.x = KF.acc._[0];
        Globals.keyframeStates[i][j].acc.y = KF.acc._[1];
        var angular = KF.angular;
        Globals.keyframeStates[i][j].angular = {acc:angular.acc,vel:angular.vel,pos:angular.pos};
      }
      
      moveOrigin({"x":restore["origin"][0], "y":restore["origin"][1]});
    
    
    for(var i=tempKF.length-1; i>=0; i--){
      setStateKF(i);
      viewportToKeyCanvas(i);
    }
    
    updateCoords(Globals.coordinateSystem);
    if(Globals.coordinateSystem == "polar"){
      $("#coord-sys").children()[1].removeAttribute("selected");
      $("#coord-sys").children()[2].setAttribute("selected", "selected");
    }
    
    if(Globals.timelineReady)
      simulate();

    highlightKeycanvas(0);
    Globals.keyframe = 0;
    setStateKF(0);
    drawMaster();
  }
  
  function setDt(dt) { Globals.world.timestep(dt); }

  return {
    initWorld:  initWorld,
    initModule: initModule,
    setDt:    setDt
  };
}

var Kinematics1D = Kinematics1DModule();
