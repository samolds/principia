$(document).ready(function() {
  //Kinematics1D.initModule();
  KinematicsSandbox.initModule();
  
  // Prepare event handling
  $('#properties-position-x').on("change", function(){ onPropertyChanged('posx', $('#properties-position-x').val()); }); 
  $('#properties-position-y').on("change", function(){ onPropertyChanged('posy', $('#properties-position-y').val()); }); 
  $('#properties-velocity-x').on("change", function(){ onPropertyChanged('velx', $('#properties-velocity-x').val()); }); 
  $('#properties-velocity-y').on("change", function(){ onPropertyChanged('vely', $('#properties-velocity-y').val()); }); 
  $('#properties-acceleration-x').on("change", function(){ onPropertyChanged('accx', $('#properties-acceleration-x').val()); }); 
  $('#properties-acceleration-y').on("change", function(){ onPropertyChanged('accy', $('#properties-acceleration-y').val()); });
  
  $('#properties-mass').on("change", function(){ onPropertyChanged('mass', $('#properties-mass').val()); }); 
  $('#properties-nickname').on("change", function(){ onPropertyChanged('nickname', $('#properties-nickname').val()); }); 
  $('#properties-img').on("change", function(){ onPropertyChanged('image', $('#properties-img option:selected')[0].value); });
  
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
