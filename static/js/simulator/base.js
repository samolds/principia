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
  //Events for canvas
  //$('#viewport').on("click")
  $( '#viewport' ).on("contextmenu", function(event){ contextMenuListener(event); } );
  $( '#viewport' ).on("click", function(event){ clickListener(event); } );
  //for tabs
  $( '#overview-tab' ).on("click", function(event){ populateOverview(event); } );

  // Events for properties window
  $('#general-properties-position-x').on("change", function(){ updatePropertyRedraw('posx', $('#general-properties-position-x').val()); });
  $('#general-properties-position-y').on("change", function(){ updatePropertyRedraw('posy', $('#general-properties-position-y').val()); });
  $('#general-properties-nickname').on("change", function(){ updatePropertyRedraw('nickname', $('#general-properties-nickname').val()); });

  $('#pointmass-properties-velocity-x').on("change", function(){ updatePropertyRedraw('velx', $('#pointmass-properties-velocity-x').val()); });
  $('#pointmass-properties-velocity-y').on("change", function(){ updatePropertyRedraw('vely', $('#pointmass-properties-velocity-y').val()); });
  $('#pointmass-properties-acceleration-x').on("change", function(){ updatePropertyRedraw('accx', $('#pointmass-properties-acceleration-x').val()); });
  $('#pointmass-properties-acceleration-y').on("change", function(){ updatePropertyRedraw('accy', $('#pointmass-properties-acceleration-y').val()); });
  $('#pointmass-properties-size').on("change", function(){ updatePropertyRedraw('size', $('#pointmass-properties-size').val()); });
  $('#pointmass-properties-mass').on("change", function(){ updatePropertyRedraw('mass', $('#pointmass-properties-mass').val()); });
  $('#pointmass-properties-img').on("change", function(){ updatePropertyRedraw('image', $('#pointmass-properties-img option:selected')[0].value); });
  $('#pointmass-properties-vector').on("change", function(){ updatePropertyRedraw('vectors', ($('#pointmass-properties-vector')[0].checked ? 1 : 0) ); });
  $('#pointmass-properties-pvagraph').on("change", function(){ updatePropertyRedraw('pvagraph', ($('#pointmass-properties-pvagraph')[0].checked ? 1 : 0) ); });

  $('#ramp-properties-width').on("change", function(){ updatePropertyRedraw('width', $('#ramp-properties-width').val()); });
  $('#ramp-properties-height').on("change", function(){ updatePropertyRedraw('height', $('#ramp-properties-height').val()); });
  $('#ramp-properties-angle').on("change", function(){ updatePropertyRedraw('angle', $('#ramp-properties-angle').val()); });
  
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
