/*
  sandbox.js --
  This file defines a kinematics module that immediately resimulates instead of supporting keyframes.
*/
function KinematicsSandboxModule() {

function initWorld() {
    return Physics(function (world) {
      var canvasId = "viewport";
      var canvasEl = document.getElementById(canvasId);
      var viewportBounds = Physics.aabb(0, 0, canvasEl.clientWidth, canvasEl.clientHeight);// bounds of the window
      var edgeBounce;
      var renderer;
      var integrator;    
      world.timestep(1.0); // TODO: should base timestep on dt option
            
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
            var component = addMass(data);
            attachSpring(component);
            break;
          case "kinematics1D-ramp":
            addRamp(data);
            break;
          case "kinematics1D-pulley":
            addPulley(data);
            break;
        }
      
        if(data.blockSimulation == 'undefined' || !data.blockSimulation) {
          simulate();
          drawMaster();
        }
          
      });
  
      // constrain objects to these bounds
      edgeBounce = Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds,
        restitution: 0.8,
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
          drawProperties();
          drawMaster();
        }
      });
  
  world.on('interact:move', function( data ){
    if(data.body) {
      if(!Globals.canEdit()) return;
      
      if(bIndex(data.body) === Globals.originObject)
      {
        Globals.origin = [data.x, data.y];
        $("#glob-xorigin").val(data.x) ; 
        $("#glob-yorigin").val(data.y) ;
      }
      
      Globals.didMove = true;
      onPropertyChanged("posx", data.x, false);
      onPropertyChanged("posy", data.y, true);
      drawMaster();
      // TODO: highlight all spring child elements within 'delta' units, remove highlight on those further away      
    }
  });
  
  world.on('interact:release', function( data ){    
    // Note that PhysicsJS adds to velocity vector upon release - commented out for our simulator
    if(data.body && Globals.didMove){
        
        // Make move as complete
        Globals.didMove = false;
        
        // Update keyframe        
        onPropertyChanged("posx", data.x, false);
        onPropertyChanged("posy", data.y, false);
        
        attachSpring(data.body);
        detachSpring(data.body);
        
        attachPulley(data.body);
        
        // Resimulate for sandbox mode
        simulate();
        drawMaster();
    }
  });
  
      world.on('interact:poke', function( data ){        
        Globals.selectedBody = false;
        
        // TODO: Switch tabs and disable element tab until body is selected?
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
    Globals.canEdit = function(){ return true; }
    Globals.canAdd =  function(){ return true; }
    Globals.solver = false;
    Globals.useKeyframes = false;
    
    // timelineReady will always be set to true in sandbox mode
    Globals.timelineReady = true;
    Globals.totalFrames = Globals.maxFrames;
    Globals.keyframe = 0;
      
    // Hard-coded spring for testing TODO remove me
    //Globals.world.emit("addComponent", {type:"kinematics1D-spring", x:100, y:100});
        
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
      var data = { 'type': type, 'x': x, 'y': y, 'blockSimulation':true};
      if(type != "kinematics1D-spring-child")
        Globals.world.emit('addComponent', data);
      Globals.bodyConstants[i] = tempBC[i];
      
      Globals.selectedBody = Globals.world.getBodies()[Globals.world.getBodies().length-1];
      if(type == "kinematics1D-mass")
        onPropertyChanged("image", tempBC[i].img, false);
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

var KinematicsSandbox = KinematicsSandboxModule();
