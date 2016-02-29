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
    timelineReady:Globals.timelineReady
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

    var name = Globals.bodyConstants[index].nickname;

    if(!name) {
      name = index;
    }

    if(!Globals.timelineReady) {
      dp1 = [];
      dp2 = [];
      dp3 = [];
    } else {
      dp1 = Globals.positionStates[index].slice(min, max);
      dp2 = Globals.accelStates[index].slice(min, max);
      dp3 = Globals.velocityStates[index].slice(min, max);
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
  // Events for properties window
  $('#properties-position-x').on("change", function(){ updatePropertyRedraw('posx', $('#properties-position-x').val()); }); 
  $('#properties-position-y').on("change", function(){ updatePropertyRedraw('posy', $('#properties-position-y').val()); }); 
  $('#properties-velocity-x').on("change", function(){ updatePropertyRedraw('velx', $('#properties-velocity-x').val()); }); 
  $('#properties-velocity-y').on("change", function(){ updatePropertyRedraw('vely', $('#properties-velocity-y').val()); }); 
  $('#properties-acceleration-x').on("change", function(){ updatePropertyRedraw('accx', $('#properties-acceleration-x').val()); });
  $('#properties-acceleration-y').on("change", function(){ updatePropertyRedraw('accy', $('#properties-acceleration-y').val()); });

  $('#properties-size').on("change", function(){updatePropertyRedraw('size', $('#properties-size').val()); });
  $('#properties-mass').on("change", function(){ updatePropertyRedraw('mass', $('#properties-mass').val()); }); 
  $('#properties-nickname').on("change", function(){ updatePropertyRedraw('nickname', $('#properties-nickname').val()); }); 
  $('#properties-img').on("change", function(){ updatePropertyRedraw('image', $('#properties-img option:selected')[0].value); });
  
  // Event for clicking solve button
  $('#solve-btn').on('click', function() {     
    attemptSimulation();
    
    // Update format of solution details
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"solution-details"]);
  });
  
  // Events for selecting mini-canvases representing keyframes
  // MUST name keyframe divs using this format (splits on -)
  $('#keyframe-0').on("click", function(event) { selectKeyframe(event); } );
  $('#keyframe-1').on("click", function(event) { selectKeyframe(event); } );
  // $('.remove-keyframe-btn').on("mouseenter", function(event) { showRemoveKeyframeBtn(event); });
  // $('.remove-keyframe-btn').on("mouseout", function(event) { hideRemoveKeyframeBtn(event); });
  $('#add-keyframe').on("click", function(event) { addKeyframe(event); } );
  $('#remove-keyframe-1').on("click", function(event) { removeKeyframe(event); } );
  
  // Events for handling updating "dt" on keyframe 1
  $('#keyframe-1-dt').on("change", function(){ 
    Globals.keyframeTimes[1] = parseFloat($('#keyframe-1-dt').val()) || "?"; 
    $('#keyframe-1-dt').val(Globals.keyframeTimes[1]);
    if(Globals.keyframeTimes[1] == "?") Globals.keyframeTimes[1] = false;
  });

  // Events for handling global acceleration (gravity)
  $('#glob-xaccel').val(Globals.gravity[0]);
  $('#glob-yaccel').val(Globals.gravity[1]);  
  $('#glob-xaccel').on("change", function(){ updatePropertyRedraw('gravityx', $('#glob-xaccel').val()); }); 
  $('#glob-yaccel').on("change", function(){ updatePropertyRedraw('gravityy', $('#glob-yaccel').val()); });
  
  // Events for handling updating the origin (w.r.t. the default coordinate space, i.e. 0,0 always means top-left)
  $('#glob-xorigin').on("change", function(){ updateOrigin("x", $('#glob-xorigin').val()); });
  $('#glob-yorigin').on("change", function(){ updateOrigin("y", $('#glob-yorigin').val()); });
  
  $('#coord-sys').on("change", function(){ updateCoords( $('#coord-sys').val()); }); 
  
  // Events for handling changing the unit
  $('#glob-length-unit').on("change", function(){ updateLengthUnit( $('#glob-length-unit').val()); }); 
  $('#glob-time-unit').on("change", function(){ updateTimeUnit( $('#glob-time-unit').val()); }); 
  
  // Position, Velocity, Acceleration Graph Set Up
  registerPVAChartEvents();
});