$(document).ready(function() {
  //Kinematics1D.initModule();
  KinematicsSandbox.initModule();
  
  //$('#properties-img').selectmenu();
  $('#properties-img').on("change", function(value) {
    var body = Globals.selectedBody;
    if(value == "none")
    {
      body.view = undefined;
    }
    else
    {
      var img = document.createElement("img");
      img.setAttribute("src", value);
      img.setAttribute("width", "40");
      img.setAttribute("height", "40");
      body.view = img;
    }
  });
  
  
  // Prepare event handling
  $('#properties-position-x').on("change", function(){ onPropertyChanged('posx', $('#properties-position-x').val()); }); 
  $('#properties-position-y').on("change", function(){ onPropertyChanged('posy', $('#properties-position-y').val()); }); 
  $('#properties-velocity-x').on("change", function(){ onPropertyChanged('velx', $('#properties-velocity-x').val()); }); 
  $('#properties-velocity-y').on("change", function(){ onPropertyChanged('vely', $('#properties-velocity-y').val()); }); 
  $('#properties-acceleration-x').on("change", function(){ onPropertyChanged('accx', $('#properties-acceleration-x').val()); }); 
  $('#properties-acceleration-y').on("change", function(){ onPropertyChanged('accy', $('#properties-acceleration-y').val()); });
  
  $('#properties-mass').on("change", function(){ onPropertyChanged('mass', $('#properties-mass').val()); }); 
  $('#properties-nickname').on("change", function(){ onPropertyChanged('nickname', $('#properties-nickname').val()); }); 
  
  $('#solve-btn').on('click', function() { attemptSimulation(); });
  
  // MUST name keyframe divs using this format (splits on -)
  $('#keyframe-0').on("click", function(event) { selectKeyframe(event); } );
  $('#keyframe-1').on("click", function(event) { selectKeyframe(event); } );
  
  $('#keyframe-1-dt').on("change", function(){ 
    Globals.keyframeTimes[1] = parseFloat($('#keyframe-1-dt').val()) || "?"; 
    $('#keyframe-1-dt').val(Globals.keyframeTimes[1]);
    if(Globals.keyframeTimes[1] == "?") Globals.keyframeTimes[1] = false;
  });

  $('#glob-xaccel').val(Globals.gravity[0]);
  $('#glob-yaccel').val(Globals.gravity[1]);
  
  $('#glob-xaccel').on("change", function(){ onPropertyChanged('gravityx', $('#glob-xaccel').val()); }); 
  $('#glob-yaccel').on("change", function(){ onPropertyChanged('gravityy', $('#glob-yaccel').val()); }); 
});