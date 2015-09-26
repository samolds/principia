requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'js/lib',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: '../app',
		jquery: 'jquery/jquery-1.11.3'
    },
	
	packages: [
		{
			name: 'physicsjs',
			location: 'physicsjs-0.7.0',
			main: 'physicsjs-full'
		}
	]
});


require([
			'jquery',
			'physicsjs'
		],
		function($, Physics) {
			 
			Physics(function(world){			  
			world.timestep(1);
			var viewWidth = 200;
			var viewHeight = 200;
					
			var renderer = Physics.renderer('canvas', {
				el: 'viewport',
				width: viewWidth,
				height: viewHeight,
				autoResize: false
			});

			// add the renderer
			world.add( renderer );
			  
			// render on each step
			world.on('step', function(){ world.render(); });
			  						
			// add a square
			var square = Physics.body('rectangle', {
					x: 10, // x-coordinate COM
					y: 10, // y-coordinate COM
					vx: 1,
					vy: 1,
					width: 20,
					height: 20
			});			
			world.add(square);			

			// add some gravity
			//world.add( Physics.behavior('constant-acceleration') );

			// bounds of the window
			var bounds = Physics.aabb(0, 0, viewWidth, viewHeight);			  
			world.add( Physics.behavior('edge-collision-detection', { aabb: bounds, restitution: 0.5 }) );			
			// ensure objects bounce when edge collision is detected
			world.add( Physics.behavior('body-impulse-response') );
			
			var states = [];			
			world.step();
			for(var i=0; i<1000; i++)
			{
				var curState = world.getBodies()[0].state;
				var acc = curState.acc.clone();
				var vel = curState.vel.clone();
				var pos = curState.pos.clone();
				var ang = {
					"acc": curState.angular.acc,
					"vel": curState.angular.vel,
					"pos": curState.angular.pos
				};
				var saveState = 
				{
					"acc": acc,
					"vel": vel,
					"pos": pos,
					"angular": ang
				};
				states.push(saveState);
				world.step();
			}
			
			var slider = document.getElementById('slider');
			slider.addEventListener("input",function(){
				document.querySelector('output').innerHTML = slider.value;
				world.getBodies()[0].state = states[slider.value];
				world.render();
			});			

			// Line 5656 for step function
			// Ideally, we would step to "frame n"
			// which is the state of the simulation at n*dt world timestep
			// Step with no arguments should advance to next frame
			
		});
});