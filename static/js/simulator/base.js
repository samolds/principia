/*
  base.js --
  This file registers event handlers immediately following module initialization
*/

// Converts the current simulation into a JSON string to be persisted in the data store
function exportToJson(){
  // NOTE LIMIT OF 1500 chars - updated with flag to store 1 MB, but consider splitting these up further
  
  // Have to unscale the positions of all of the bodies in all keyframes before saving the data
  var scaledKeyframes = Globals.keyframeStates;
  var unscaledKeyframeStates = [];

  // Only need to scale the positions if the simulator has been zoomed in or out
  if (getScaleFactor() !== 1) {

    // Need to update in all keyframes
    for (var i = 0; i < scaledKeyframes.length; i++) {
      var keyframe = scaledKeyframes[i];
      var clonedState = [];
      for (var j = 0; j < keyframe.length; j++) {
        var objState = cloneState(keyframe[j]);
        objState.pos.x = objState.pos.x * getScaleFactor();
        objState.pos.y = swapYpos(swapYpos(objState.pos.y, false) * getScaleFactor(), false);
        clonedState.push(objState);
      }
      unscaledKeyframeStates.push(clonedState);
    }
  } else {
    unscaledKeyframeStates = scaledKeyframes;
  }
  
  var json = 
  {
    keyframeStates:unscaledKeyframeStates, //TODO store keyframe states in separate fields, 1 per object per keyframe
    bodyConstants:Globals.bodyConstants,
    gravity:Globals.gravity,
    variableMap:Globals.variableMap,
    totalFrames:Globals.totalFrames,
    maxFrames:Globals.maxFrames,
    timelineReady:Globals.timelineReady,
    origin:Globals.origin,
    coordinateSystem: Globals.coordinateSystem
  }
  
  return JSON.stringify(json);
}

// Returns contents of a canvas as a jpeg based data url, with the specified
// background color
// http://www.mikechambers.com/blog/2011/01/31/setting-the-background-color-when-generating-images-from-canvas-todataurl
function canvasToImage() {
  // cache height and width
  var canvas = Globals.world.renderer();
  var context = canvas.ctx;
  var w = canvas.width;
  var h = canvas.height;

  // get the current ImageData for the canvas.
  var data = context.getImageData(0, 0, w, h);

  // store the current globalCompositeOperation
  var compositeOperation = context.globalCompositeOperation;

  // set to draw behind current content
  context.globalCompositeOperation = "destination-over";

  // set background color
  context.fillStyle = '#ffffff';

  // draw background / rect on entire canvas
  context.fillRect(0, 0, w, h);

  // get the image data from the canvas and decrement image quality 70%
  var imageData = canvas.el.toDataURL("image/jpeg", 0.3);

  // clear the canvas
  context.clearRect(0, 0, w, h);

  // restore it with original / cached ImageData
  context.putImageData(data, 0, 0);

  // reset the globalCompositeOperation to what it was
  context.globalCompositeOperation = compositeOperation;

  // var head = 'data:image/jpeg;base64,';
  // var imgFileSize = Math.round((imageData.length - head.length) * 3/4) ;
  // console.log("generated image file size: " + imgFileSize);

  // return the Base64 encoded data url string
  return imageData;
}

// Turns the dataURI created by the canvas to an actual blob that is recognized
// as a file to be uploaded in a form and saved to the blobstore
// http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type:mimeString});
}


function registerPVAChartEvents() {
  positionChart = new CanvasJS.Chart("positionGraph",{
      // // axisX:{
      // //   maximum: 1000,
      // // },
    });

    vaChart = new CanvasJS.Chart("vaGraph",{
      // // axisX:{
      // //   maximum: 1000,
      // // },
    });

    var allHidden = (graphBodyIndices().length === 0);
    if (!allHidden) {
      $('.pva-graph-no-graph-text').hide()
      $('#positionGraph').show()
      $('#vaGraph').show()
      updatePVAChart();
    } else {
      $('.pva-graph-no-graph-text').show()
      $('#positionGraph').hide()
      $('#vaGraph').hide()
    }
}

function updatePVAChart() {

  arr = graphBodyIndices();

 

  // Mod by the number of bodies we need to draw
  if(Globals.frame % arr.length !== 0) {
    return;
  }

  positionChart.options.data = [];
  vaChart.options.data = [];
  min = Math.max(Globals.frame - 99, 0)
  max = Globals.frame + 1;

  for (var index = 0, len = arr.length; index < len; index++) {

    var bodyIndex = arr[index];
    var name = Globals.bodyConstants[bodyIndex].nickname;

    if(!name) {
      name = bodyIndex;
    }

    if(!Globals.timelineReady) {
      dp1 = [];
      dp2 = [];
      dp3 = [];
    } else {
      dp1 = Globals.positionStates[bodyIndex].slice(min, max);
      dp2 = Globals.accelStates[bodyIndex].slice(min, max);
      dp3 = Globals.velocityStates[bodyIndex].slice(min, max);
    }

    positionChart.options.data.push({
      type: "line",
      showInLegend: true,
      name: "Position " + name,
      dataPoints: dp1
    });

    vaChart.options.data.push({
      type: "line",
      showInLegend: true,
      name: "Acceleration " + name,
      dataPoints: dp2
    });

    vaChart.options.data.push({
      type: "line",
      showInLegend: true,
      name: "Velocity " + name,
      dataPoints: dp3
    });
  }

  positionChart.render();
  vaChart.render();
};

// Entry point for this application. Registers events. The module is initialized in the HTML file for now.
$(document).ready(function(){
  //Events for canvas
  $( '#viewport' ).on("contextmenu", function(event){
    contextMenuListener(event);
  });
  
  $( '#viewport' ).on("click", function(event){
    clickListener(event);
  });

  $(document).on('click', function(event) {
    bodyClickListener(event);
  });  

  $('#viewport').on("mousedown", function(event){
    event.preventDefault();
  });
  
  $('#viewport').on("mouseleave", function(event){    
    Globals.world.emit("interact:release", {});
  });

  // Events for overview tab
  $( '#overview-tab' ).on("click", function(event){ populateOverview(event); } );

  // Events for properties window
  $('#general-properties-position-x').on("change", function(){ 
    updatePropertyRedraw(Globals.selectedBody, 'posx', $('#general-properties-position-x').val());
  });
  $('#general-properties-position-y').on("change", function(){ 
    updatePropertyRedraw(Globals.selectedBody, 'posy', $('#general-properties-position-y').val());
  });
  $('#general-properties-nickname').on("change", function(){ 
    updateNickname(Globals.selectedBody, $('#general-properties-nickname').val()); 
  });
  
  // Point mass specific events
  $('#pointmass-properties-velocity-x').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'velx', $('#pointmass-properties-velocity-x').val());
  });
  $('#pointmass-properties-velocity-y').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'vely', -1 * parseFloat($('#pointmass-properties-velocity-y').val()));
  });
  $('#pointmass-properties-acceleration-x').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'accx', $('#pointmass-properties-acceleration-x').val());
  });
  $('#pointmass-properties-acceleration-y').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'accy', -1 * parseFloat($('#pointmass-properties-acceleration-y').val()));
  });
  $('#pointmass-properties-size').on("change", function(){
    updateSize(Globals.selectedBody, $('#pointmass-properties-size').val());
  });
  $('#pointmass-properties-mass').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'mass', $('#pointmass-properties-mass').val());
  });
  $('#pointmass-properties-img').on("change", function(){
    updateImage(Globals.selectedBody, $('#pointmass-properties-img option:selected')[0].value);
  });


  $("#pointmass-properties-vector-cmenu").on("change", function() {
    updateBooleanProperty(Globals.selectedBody, 'vectors', $('#pointmass-properties-vector-cmenu')[0].checked);
  });
  $("#pointmass-properties-vector-ttt-cmenu").on("change", function() {
    updateBooleanProperty(Globals.selectedBody, 'vectors_ttt', $('#pointmass-properties-vector-ttt-cmenu')[0].checked);
  });
  $("#pointmass-properties-pvagraph-cmenu").on("change", function() {
    updateBooleanProperty(Globals.selectedBody, 'showGraph', $('#pointmass-properties-pvagraph-cmenu')[0].checked);
  });
  $("#pointmass-properties-vector").on("change", function() {
    updateBooleanProperty(Globals.selectedBody, 'vectors', $('#pointmass-properties-vector')[0].checked);
  });
  $("#pointmass-properties-vector-ttt").on("change", function() {
    updateBooleanProperty(Globals.selectedBody, 'vectors_ttt', $('#pointmass-properties-vector-ttt')[0].checked);
  });
  $("#pointmass-properties-pvagraph").on("change", function() {
    updateBooleanProperty(Globals.selectedBody, 'showGraph', $('#pointmass-properties-pvagraph')[0].checked);
  });


  // Surface specific events
  $('#surface-properties-width').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'surfaceWidth', $('#surface-properties-width').val());
  });
  $('#surface-properties-height').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'surfaceHeight', $('#surface-properties-height').val());
  });
  $('#surface-properties-friction').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'surfaceFriction', $('#surface-properties-friction').val());
  });
  $('#surface-properties-rotate').on("click", function(){
    var w = body2Constant(Globals.selectedBody).surfaceWidth;
    var h = body2Constant(Globals.selectedBody).surfaceHeight;
    setSurfaceWidth(Globals.selectedBody, h);
    setSurfaceHeight(Globals.selectedBody, w);
    if(Globals.numKeyframes == 1) attemptSimulation();
    drawMaster();
  });


  // Ramp specific events
  $('#ramp-properties-width').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'rampWidth', $('#ramp-properties-width').val());
  });
  $('#ramp-properties-height').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'rampHeight', $('#ramp-properties-height').val());
  });
  $('#ramp-properties-angle').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'rampAngle', $('#ramp-properties-angle').val());
  });
  $('#ramp-properties-friction').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'rampFriction', $('#ramp-properties-friction').val());
  });
  $('#ramp-properties-flip-horz').on("click", function(){
    setRampWidth(Globals.selectedBody, -1 * body2Constant(Globals.selectedBody).rampWidth, true);
    if(Globals.numKeyframes == 1) attemptSimulation();
    drawMaster();
  });
  $('#ramp-properties-flip-vert').on("click", function(){
    setRampHeight(Globals.selectedBody, -1 * body2Constant(Globals.selectedBody).rampHeight, true);
    if(Globals.numKeyframes == 1) attemptSimulation();
    drawMaster();
  });


  // enable modals
  $('.modal-trigger').leanModal();
  
  // Event for clicking solve button
  $('#playpause').on('click', function(){
    if (!Globals.timelineReady) {
      attemptSimulation();
      // Show the solution details button
      $('#solution-detail-button').show();
    }

    toggleSimulator();
  });
  
  // Events for selecting mini-canvases representing keyframes
  // MUST name keyframe divs using this format (splits on -)
  $('#keyframe-0').on("click", function(event) { selectKeyframe(event); } );
  $('#add-keyframe').on("click", function(event) { addKeyframe(event); } );

  $('.right-menu-item').on("click", function(event) { rightSlideMenuOpen(event); } );
  $('.left-menu-item').on("click", function(event) { leftSlideMenuOpen(event); } );

  $('.right-menu-item-close').on("click", function(event) { rightSlideMenuClose(event); } );
  $('.left-menu-item-close').on("click", function(event) { leftSlideMenuClose(event); } );

  $(document).on('keyup', function(event) {keyUp(event)});
  $(document).on('keydown', function(event) {keyDown(event)});
  
  // Events for handling global acceleration (gravity)
  $('#glob-xaccel').val(Globals.gravity[0]); $('#glob-yaccel').val(Globals.gravity[1]);  
  $('#glob-xaccel').on("change", function(){ updateGravity('x', $('#glob-xaccel').val()); }); 
  $('#glob-yaccel').on("change", function(){ updateGravity('y', -1 * parseFloat($('#glob-yaccel').val())); });
  
  // Events for handling updating the origin w.r.t. 0,0 being the bottom left
  $('#glob-xorigin').on("change", function(){ moveOriginScalar("x", $('#glob-xorigin').val()); });
  $('#glob-yorigin').on("change", function(){ moveOriginScalar("y", $('#glob-yorigin').val()); });
  
  $('#coord-sys').on("change", function(){ updateCoords( $('#coord-sys').val()); }); 
  
  // Events for handling changing the unit
  $('#glob-length-unit').on("change", function(){ updateLengthUnit( $('#glob-length-unit').val()); }); 
  $('#glob-time-unit').on("change", function(){ updateTimeUnit( $('#glob-time-unit').val()); }); 

  $('#glob-timestep-unit').on("change", function() { 
      Globals.world.timestep(parseFloat($('#glob-timestep-unit').val())); 
      if(Globals.numKeyframes == 1) attemptSimulation();
      updateRangeLabel();
      drawMaster();
  });
  
  $("#elementprops-tab").on("click", function() { 
    if(bIndex(Globals.selectedBody) === 0) { Globals.selectedBody = false; drawMaster(); } 
  });
  
  $('#zoom-control-in').on("click", function(e) {
    simulationZoom(1);
  });

  $('#zoom-control-out').on("click", function(e) {
    simulationZoom(-1);
  });
  
  // Position, Velocity, Acceleration Graph Set Up
  registerPVAChartEvents();
  
  // Configure MathJax
  MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}});
});
