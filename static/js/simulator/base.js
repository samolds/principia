/*
  base.js --
  This file registers event handlers immediately following module initialization
*/

// Converts the current simulation into a JSON string to be persisted in the data store
function exportToJson(){
  // NOTE LIMIT OF 1500 chars - updated with flag to store 1 MB, but consider splitting these up further
  var json = 
  {
    keyframeStates:Globals.keyframeStates, //TODO store keyframe states in separate fields, 1 per object per keyframe
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

function registerPVAChartEvents() {
  positionChart = new CanvasJS.Chart("positionGraph",{
      // // axisX:{
      // //   maximum: 4000,
      // // },
    });

    vaChart = new CanvasJS.Chart("vaGraph",{
      // // axisX:{
      // //   maximum: 4000,
      // // },
    });

    updatePVAChart();
}

function updatePVAChart() {

  arr = graphBodyIndices();

  if(arr.length == 0) {
    $('#pvaGraphContainer').hide();
    return;
  }

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
  
  $( '#viewport' ).on("mousedown", function(event){
    Globals.lastPos.x = event.clientX;
    Globals.lastPos.y = event.clientY;
    $('body').css({cursor: "move"});
    $( '#viewport' ).on("mousemove", panZoomListener);
  });

  $( '#viewport' ).on("mouseup", function(event){
    $( '#viewport' ).off("mousemove", panZoomListener);
    $('body').css({cursor: "pointer"});
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


  // Ramp specific events
  $('#ramp-properties-width').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'width', $('#ramp-properties-width').val()); 
  });
  $('#ramp-properties-height').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'height', $('#ramp-properties-height').val());
  });
  $('#ramp-properties-angle').on("change", function(){
    updatePropertyRedraw(Globals.selectedBody, 'angle', $('#ramp-properties-angle').val());
  });
  $('#ramp-properties-flip-horz').on("click", function(){
    setRampWidth(Globals.selectedBody, -1 * body2Constant(Globals.selectedBody).width, true);
    if(Globals.numKeyframes == 1) attemptSimulation();
    drawMaster();
  });
  $('#ramp-properties-flip-vert').on("click", function(){
    setRampHeight(Globals.selectedBody, -1 * body2Constant(Globals.selectedBody).height, true);
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

  $('#help-tooltips').on("click", function() { displayTooltips(); });
  
  $("#elementprops-tab").on("click", function() { 
    if(bIndex(Globals.selectedBody) === 0) { Globals.selectedBody = false; drawMaster(); } 
  });
  
  // Position, Velocity, Acceleration Graph Set Up
  registerPVAChartEvents();
  
  // Configure MathJax
  MathJax.Hub.Config({tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}});
});
