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
		  case "kinematics1D-spring-end":
            img.setAttribute("width", "70");
            img.setAttribute("height", "70");
            component = Physics.body('circle', {
              x: data.x,
              y: data.y,
			  ctype: data.type,
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
              ctype: data.type,
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
		for(var i=0; i < Globals.keyframeStates.length; i++){
			Globals.keyframeStates[i].push(cloneState(component.state));	
		}
		    
		if(data.type == "kinematics1D-spring") {
			world.emit('addSpring', component);
		}
		if(data.type == "kinematics1D-spring-end") {
			component.parent = data.parent;
		}	
		
		drawKeyframe(1); // Temp: draw all future keyframes
		drawKeyframe(Globals.selectedKeyframe);		
      });
	  
	  world.on('addSpring', function(parent){		
			Globals.didAddMultiComponent = true;
			var img = document.createElement("img");
			img.setAttribute("src", "/static/img/logo/logo.png");
			img.setAttribute("width", "70");
			img.setAttribute("component", "kinematics1D-spring-end");
			$('#toolbox').append(img);
			$(document).mousemove(function(e) { 
				$(img).offset({ top: e.pageY, left: e.pageX }); 				
			});
			$(document).mouseup(function(e) { 
				console.log('spring!');
				img.parentElement.removeChild(img);
				$(document).unbind('mousemove');
				$(document).unbind('mouseup');
				Globals.didAddMultiComponent = false;
				
				// Left and top of canvas window
				var vleft = $("#" + Globals.canvasId).position().left;
				var vtop = $("#" + Globals.canvasId).position().top;

				var data = { 'type': img.getAttribute("component"), 'x': event.pageX-vleft, 'y': event.pageY-vtop, 'parent': parent};
				Globals.world.emit("addComponent", data);
			});
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
			//var idx = Globals.world.getBodies().indexOf(Globals.world.findOne( function(body){ return body.isGrabbed; }))
			var frame = canEdit()? Globals.selectedKeyframe: Globals.frame;
			Globals.selectedBody = data.body;
			if(canEdit())
				drawKeyframe(frame);
			else
				drawSimulator(frame);
			
		}
	});
	
	world.on('interact:move', function( data ){
		if(data.body && canEdit()) {
			if(Globals.running) toggleSimulator();
			data.body.state.pos.x = data.x;
			data.body.state.pos.y = data.y;
			Globals.world.render();
			highlightSelection(Globals.selectedBody);			
			drawLines();
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
				drawKeyframe(Globals.selectedKeyframe);	
			}			
		}
	});
	
	world.on('interact:poke', function( data ){
		var frame = canEdit()? Globals.selectedKeyframe: Globals.frame;
		Globals.selectedBody = false;
		if(canEdit())
			drawKeyframe(frame);
		else
			drawSimulator(frame);
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
	// TODO: Have this method support loading via JSON string
  }
  
  function setDt(dt) { Globals.world.timestep(dt); }

  return {
    initWorld:  initWorld,
    initModule: initModule,
	setDt:		setDt
  };
}

var Kinematics1D = Kinematics1DModule();