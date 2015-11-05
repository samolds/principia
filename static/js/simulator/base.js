function allowDrop(ev) { ev.preventDefault();}

function drag(ev){ 
	ev.dataTransfer.setData("id", ev.target.id);	
	ev.dataTransfer.setData("x", ev.clientX);	
	ev.dataTransfer.setData("y", ev.clientY);	
}

function drop(ev) {	
	ev.preventDefault();
	var canvas = $( "canvas:first" );
	var position = canvas.position();
	var data = {'id':ev.dataTransfer.getData("id"), 'x':ev.dataTransfer.getData("x") - position.left,'y':ev.dataTransfer.getData("y")};
	
	console.log(data.x);
	console.log(data.y);
		
	world.emit('addComponent', data);
	//console.log(data.target.id);
	//console.log(ev.clientX - position.left); //NOTE: this works at 100% scale, but clientX changes based on zoom
};