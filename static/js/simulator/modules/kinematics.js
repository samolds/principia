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
        var component;
        var componentChild = false;  
        var variableMap = Globals.variableMap;
        var bodyConstants = Globals.bodyConstants;
    
        switch(data.type){
          case "kinematics1D-spring":         
            component = Physics.body('circle', {
              treatment:"static",
              x: data.x,
              y: data.y,           
              radius: 5,
              styles: {
                fillStyle: '#6c71c4',
                angleIndicator: '#3b3e6b'
              }
            });
            componentChild = Physics.body('circle', {              
              treatment:"static",
              x: data.x+120,
              y: data.y,             
              radius: 5,                    
              styles: {
                fillStyle: '#6c71c4',
                angleIndicator: '#3b3e6b'
              }
            });
            variableMap.push({k:0.01, eq:60});           // Variables associated with spring constants    
            variableMap.push({x0:data.x, xf: data.x});  // Variables associated with stretched point. Necessary? Should be
            break;
      
          case "kinematics1D-mass":
            var img = document.createElement("img");
            img.setAttribute("src", "/static/img/logo/logo.png");
            img.setAttribute("width", "40");
            img.setAttribute("height", "40");
            component = Physics.body('circle', {
            x: data.x,
            y: data.y,
            radius: 20,        
            view: img,
            styles: {
              fillStyle: '#716cc4',
              angleIndicator: '#3b3e6b'
            }
          });                    
          
          // Upon being added, a map of variables associated with this mass is added to the globals
          variableMap.push({x0:data.x, xf: data.x, v0:0, vf:0, a:0, m:1});
          break;
        }
    
        console.log("Added at " + data.x + "," + data.y);
            
        bodyConstants.push({ctype:data.type});

        if(data.type == "kinematics1D-mass") bodyConstants[bodyConstants.length-1].mass = 1.0;
        world.add(component);
        
        
        if(componentChild){
          world.add(componentChild);
          bodyConstants.push({ctype:data.type + "-child"});  
          bodyConstants[bodyConstants.length-2].child = componentChild;
          bodyConstants[bodyConstants.length-1].parent = component;
          
          // Spring constant and equilibrium point
          bodyConstants[bodyConstants.length-2].k = 0.01;
          bodyConstants[bodyConstants.length-2].eq = 60;
        }
    

        var nKF = Globals.keyframeStates.length;
        
        // Must enforce invariant: Index of body in keyframe states must match index of body in world.getBodies()
        // Add the body to every keyframe and update that world state's rendering
        for(var i=0; i < nKF; i++){
          Globals.keyframeStates[i].push(cloneState(component.state)); 
          if(componentChild) Globals.keyframeStates[i].push(cloneState(componentChild.state));
          setStateKF(i);
          world.render();
          viewportToKeyCanvas(i);
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
      onPropertyChanged("posy", data.y, true);
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
    var kflabels = $("#keyframe-labels")[0].classList;
    if (kflabels.contains("hide")) { kflabels.remove("hide");}
    
    var kf0 = $("#keyframe-0")[0].classList;
    if (kf0.contains("hide")) { kf0.remove("hide");}
    
    var kf1 = $("#keyframe-1")[0].classList;
    if (kf1.contains("hide")) { kf1.remove("hide");}
    
  }
  
  function setDt(dt) { Globals.world.timestep(dt); }

  return {
    initWorld:  initWorld,
    initModule: initModule,
    setDt:    setDt
  };
}

var Kinematics1D = Kinematics1DModule();
