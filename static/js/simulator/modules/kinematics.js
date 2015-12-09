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
        console.log("grab");
        if(data.body){
          Globals.selectedBody = data.body;
          drawMaster()
        }
      });
  
  world.on('interact:move', function( data ){
    if(data.body) {
      if(!Globals.canEdit()) return;
      
      Globals.didMove = true;
      onPropertyChanged("posx", data.x, false);
      onPropertyChanged("posy", data.y, false);
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
        onPropertyChanged("posx", data.x, false);
        onPropertyChanged("posy", data.y, true);
        
        // Update variable map
        if(Globals.keyframe == 0)
          Globals.variableMap[i]["x0"] = data.x;
        else
          Globals.variableMap[i]["xf"] = data.x;
    }
  });
  
      world.on('interact:poke', function( data ){
        console.log("poke: " + data.x + "," + data.y);
        Globals.selectedBody = false;
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
    Globals.canEdit = function(){ return (Globals.keyframe || Globals.keyframe === 0); }
    Globals.canAdd =  function(){ return  Globals.keyframe === 0; }
    
    // How the solver object works:
    // Try to assign a value to each key using known variables
    // Repeat until no new values can be assigned
    // Note that an overconstrained problem could still be solved with this method, leading to unsound results
    var kinematicsSolver = new Solver(
    {
      xf:
      {
        eq:['x0 + v0*t + 0.5*a*t^2'],
        pretty:[' using the kinematic equation xf = x + vt + 1/2 a t^2 '], 
        vars:[['x0','v0','a','t']]
      },
      
      vf:
      {
        eq:['v0 + a*t'],
        pretty:[' using the kinematic equation vf = v + a*t '],
        vars:[['v0','a','t']]
      },
      
      v0:
      {
        eq:['vf-a*t'],
        pretty:[' rearranging the kinematic equation vf = v + a*t'],
        vars:[['vf','a','t']]
      },
      
      x0:
      {
        eq:['xf-v0*t-0.5*a*t^2'],
        pretty:[' rearranging the kinematic equation xf = x + vt + 1/2 a t^2 '],
        vars:[['xf','v0','t','a']]
      },
      
      t:
      {
        eq:['(vf-v0)/a'],
        pretty:[' rearranging the kinematic equation vf = v + a*t '],
        vars:[['vf','v0','a']]
      },
      
      a:
      {
        eq:['(vf-v0)/t'],
        pretty:[' rearranging the kinematic equation vf = v + a*t '],
        vars:[['vf','v0','t']]
      }
    });
    
    Globals.solver = kinematicsSolver;
    Globals.useKeyframes = true;
    
    // Show keyframe/solver material
    /*
    var kflabels = $("#keyframe-labels")[0].classList;
    if (kflabels.contains("hide")) { kflabels.remove("hide");}
    
    var kf0 = $("#keyframe-0")[0].classList;
    if (kf0.contains("hide")) { kf0.remove("hide");}
    
    var kf1 = $("#keyframe-1")[0].classList;
    if (kf1.contains("hide")) { kf1.remove("hide");}
    */
    
    if(!json || json == "{}")
      return;
    
    var restore = $.parseJSON(json);
    for(var key in restore)
    {
      if(key == "keyframeStates") continue;
      if(key == "bodyConstants") continue;
      Globals[key] = restore[key];
    }
    
    // Stringified keyframes don't interact well with PhysicsJS
    // Solution: Add the real component to get PhysicsJS state object
    // Then transfer tempKF values to real corresponding "real" keyframe
    var tempKF = restore.keyframeStates;
    var tempBC = restore.bodyConstants;
    
    for(var i=0; i<tempBC.length; i++)
    {
      var type = tempBC[i].ctype;
      var x = tempKF[0][i].pos._[0];
      var y = tempKF[0][i].pos._[1];
      var data = { 'type': type, 'x': x, 'y': y};
      if(type != "kinematics1D-spring-child")
        Globals.world.emit('addComponent', data);
      Globals.bodyConstants[i] = tempBC[i];
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
    
    setStateKF(0);
    
    if(Globals.timelineReady)
      simulate();
    
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