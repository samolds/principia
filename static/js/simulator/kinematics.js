// Copy and pasted from http://wellcaffeinated.net/PhysicsJS/
// Simple example of bouncing balls

function Kinematics1DModule( ){
	
var initWorld = 
function initWorld(){

if(world != undefined)
	world.destroy();
	
return Physics(function (world) {
    
	world.timestep(1); // TODO: should base timestep on dt
	
	// bounds of the window
    var viewportBounds = Physics.aabb(0, 0, document.getElementById("viewport").clientWidth, document.getElementById("viewport").clientHeight)
        ,edgeBounce
        ,renderer
        ;

    // create a renderer
    renderer = Physics.renderer('canvas', { el: 'viewport'});

    // add the renderer
    world.add(renderer);
    	
	world.on('addComponent', function(data) {
		var component;
		console.log(data.x +"," + data.y);
		switch(data.type)
		{
			case "kinematics1D-spring":
				component = Physics.body('circle', {
					 x: data.x
					,y: data.y			
					,radius: 20
					,mass: 3
					,styles: {
							fillStyle: '#6c71c4'
							,angleIndicator: '#3b3e6b'
						}
					});
			break;
			
			
			case "kinematics1D-mass":
				component = Physics.body('circle', {
					 x: data.x
					,y: data.y		
					,radius: 10
					,mass: 3
					,styles: {
							fillStyle: '#716cc4'
							,angleIndicator: '#3b3e6b'
						}
					});
			break;
		}
		
		world.add(component);
		initStates.push(cloneState(component.state));
		
		// Resimulate using newly added component
		simulate();
		drawSimulator(0);
	});
	
    // constrain objects to these bounds
    edgeBounce = Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds
        ,restitution: 0.99
        ,cof: 0.8
    });	
	
    // resize events
    window.addEventListener('resize', function () {	
        // as of 0.7.0 the renderer will auto resize... so we just take the values from the renderer
        viewportBounds = Physics.aabb(0, 0, renderer.width, renderer.height);
        // update the boundaries
        edgeBounce.setAABB(viewportBounds);
		
		drawSimulator(frame);
    }, true);
	
    // add things to the world
    world.add([
        Physics.behavior('interactive', { el: renderer.container })
        ,Physics.behavior('constant-acceleration')
        ,Physics.behavior('body-impulse-response')
        ,edgeBounce
    ]);   
});	

} // end initWorld

var initModule = 
function initModule(){
	world = initWorld();
	simulate();
	drawSimulator(0);
}

return {initWorld, initModule};
}

var Kinematics1D = Kinematics1DModule();