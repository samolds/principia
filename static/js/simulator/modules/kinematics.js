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
      world.timestep(0.1); // TODO: should base timestep on dt option
            
      // create a renderer
      renderer = Physics.renderer('canvas', {el: canvasId});

      // add the renderer
      world.add(renderer);
    
      // add our custom integrator
      integrator = Physics.integrator('principia-integrator', {});
      world.add(integrator);

      world.on('addComponent', function(data) {
        
        var variableMap = Globals.variableMap;
        var bodyConstants = Globals.bodyConstants;

        bodyConstants.push({ctype:data.type});
        
        switch(data.type){
          case "kinematics1D-spring":         
            bodyConstants.push({ctype:data.type + "-child"});
            addSpring(data);
            break;
      
          case "kinematics1D-mass":
            addMass(data);
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
          Globals.selectedBody = data.body;
          drawMaster()
        }
      });
  
  world.on('interact:move', function( data ){
    if(data.body) {
      if(!Globals.canEdit()) return;
      
      Globals.didMove = true;
      onPropertyChanged("posx", data.x);
      onPropertyChanged("posy", data.y);
      drawMaster();
    }
  });
  
  world.on('interact:release', function( data ){    
    // Note that PhysicsJS adds to velocity vector upon release - commented out for our simulator
    if(data.body && Globals.didMove){
        
        // Make move as complete
        Globals.didMove = false;
        
        // Update keyframe
        var kStates = Globals.keyframeStates[Globals.keyframe];
        var i = Globals.world.getBodies().indexOf(data.body);
        onPropertyChanged("posx", data.x);
        onPropertyChanged("posy", data.y);
        
        // Update variable map
        if(Globals.keyframe == 0)
          Globals.variableMap[i]["x0"] = data.x;
        else
          Globals.variableMap[i]["xf"] = data.x;
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
    Globals.canEdit = function(){ return (Globals.keyframe ||
                                          Globals.keyframe === 0 ||
                                          (Globals.frame == Globals.totalFrames) && Globals.totalFrames != 0); }
    Globals.canAdd =  function(){ return  Globals.keyframe === 0; }
    Globals.useKeyframes = true;
    
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
        eq:['(vxf-vx0)/ax', '(vyf-vy0)/ay'],
        pretty:[' rearranging the kinematic equation ${v_x}_f = {v_x}_0 + a_x*t$ ', ' rearranging the kinematic equation ${v_y}_f = {v_y}_0 + a_y*t$ '],
        vars:[['vxf','vx0','ax'],['vyf','vy0','ay']],
        prettyvars:[['${v_x}_f$','${v_x}_0$','$a_x$'],['${v_y}_f$','${v_y}_0$','$a_y$']]
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
  }
  
  function setDt(dt) { Globals.world.timestep(dt); }

  return {
    initWorld:  initWorld,
    initModule: initModule,
    setDt:    setDt
  };
}

var Kinematics1D = Kinematics1DModule();