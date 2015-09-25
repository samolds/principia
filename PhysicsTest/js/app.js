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
			main: 'physicsjs-full.min'
		}
	]
});


require([
			'jquery',
			'physicsjs'
		],
		function($, Physics) {
			 
			Physics(function(world){			  

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
					x: 10, // x-coordinate
					y: 10, // y-coordinate	
					vx: 0.4,
					width: 20,
					height: 20
			});			
			world.add(square);

			// add some gravity
			world.add( Physics.behavior('constant-acceleration') );

			// bounds of the window
			var bounds = Physics.aabb(0, 0, viewWidth, viewHeight);			  
			world.add( Physics.behavior('edge-collision-detection', { aabb: bounds, restitution: 0.5 }) );			
			// ensure objects bounce when edge collision is detected
			world.add( Physics.behavior('body-impulse-response') );
			  
			// subscribe to ticker to advance the simulation
			Physics.util.ticker.on(function( time, dt ){ world.step( time ); });

			// start the ticker
			Physics.util.ticker.start();
		});
});