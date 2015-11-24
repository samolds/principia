function Kinematics1DModule() {
  function initWorld() {
    return Physics(function (world) {
      var canvasId = "viewport";
      var canvasEl = document.getElementById(canvasId);
      var viewportBounds = Physics.aabb(0, 0, canvasEl.clientWidth, canvasEl.clientHeight);// bounds of the window
      var edgeBounce;
      var renderer;
	  var integrator;	  
	  world.timestep(1); // TODO: should base timestep on dt option

            
      // create a renderer
      renderer = Physics.renderer('canvas', {el: canvasId});

      // add the renderer
      world.add(renderer);
	  
	  // add our custom integrator
	  integrator = Physics.integrator('my-integrator', {});
	  world.add(integrator);

      world.on('addComponent', function(data) {
        var component;
        var img = document.createElement("img");
        img.setAttribute("src", "/static/img/logo/logo.png");
        switch(data.type) {
          case "kinematics1D-spring":
            img.setAttribute("width", "70");
            img.setAttribute("height", "70");
            component = Physics.body('circle', {
              x: data.x,
              y: data.y,
              radius: 35,
              mass: 3,
              view: img,
              styles: {
                fillStyle: '#6c71c4',
                angleIndicator: '#3b3e6b'
              }
            });
            break;
          case "kinematics1D-mass":
            img.setAttribute("width", "40");
            img.setAttribute("height", "40");
            component = Physics.body('circle', {
              x: data.x,
              y: data.y,
              radius: 20,
              mass: 3,
              view: img,
              styles: {
                fillStyle: '#716cc4',
                angleIndicator: '#3b3e6b'
              }
            });
            break;
        }
        world.add(component);
        		
		// Must enforce invariant: Index of body in keyframe states must match index of body in world.getBodies()		
		Globals.keyframeStates[0].push(cloneState(component.state));
		Globals.keyframeStates[1].push(cloneState(component.state));

        drawKeyframe(Globals.selectedKeyframe);
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

        // update the boundaries
        edgeBounce.setAABB(viewportBounds);
        drawKeyframe(Globals.currentKeyframe);
      }, true);

	world.on('interact:grab', function( data ){
		console.log("grab");
		if(data.body)
		{
			// Note: PhysicsJS zeroes out velocity (ln 8445) - commented out for our simulator		
			var idx = Globals.world.getBodies().indexOf(Globals.world.findOne( function(body){ return body.isGrabbed; }))
			var state = Globals.selectedKeyframe? Globals.keyframeStates[Globals.selectedKeyframe][idx]: Globals.states[idx][Globals.frame];
			Globals.selectedBody = data.body;
								
			displayElementValues(state);
			highlightSelection(data.body);
		}
	});
	world.on('interact:move', function( data ){
		if(data.body && canEdit()) {
			if(Globals.running) toggleSimulator();
			data.body.state.pos.x = data.x;
			data.body.state.pos.y = data.y;
			Globals.world.render();
			highlightSelection(Globals.selectedBody);			
			Globals.didMove = true;
		}
	});
	
	world.on('interact:release', function( data ){		
		// Note that PhysicsJS adds to velocity vector upon release - commented out for our simulator
		if(data.body){
			if(Globals.didMove) {
				var kStates = Globals.keyframeStates[Globals.selectedKeyframe];
				var i = Globals.world.getBodies().indexOf(data.body);
				kStates[i].pos.x = data.x;
				kStates[i].pos.y = data.y;
				Globals.didMove = false;
				//simulate();				
				drawKeyframe(Globals.selectedKeyframe);	
			}			
		}
	});
	
	world.on('interact:poke', function( data ){
		Globals.selectedBody = false;
		console.log("poke: " + data.x + "," + data.y);
		displayElementValues(false);
		Globals.world.render(); // To remove any drawn borders
	});
	
	  
      // add things to the world
      world.add([
        Physics.behavior('interactive', {el: renderer.container}),
        Physics.behavior('constant-acceleration'),
        Physics.behavior('body-impulse-response'),
        Physics.behavior('body-collision-detection'),
		Physics.behavior('sweep-prune'),
        edgeBounce
      ]);
    });
  } // end initWorld

  function initModule() {
    Globals.world = initWorld();
    simulate();
    drawSimulator(0);
  }
  
  function setDt(dt) {
	Globals.world.timestep(dt);
  }

  return {
    initWorld:  initWorld,
    initModule: initModule,
	setDt:		setDt
  };
}

var Kinematics1D = Kinematics1DModule();