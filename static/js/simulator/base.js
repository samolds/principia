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

  positionChart.options.data = [];
  vaChart.options.data = [];

  arr.forEach(function(index){

    var name = Globals.bodyConstants[index].nickname;
    if(!name) {
      name = index;
    }

    positionChart.options.data.push({
      type: "line",
      showInLegend: true,
      name: "Position " + name,
      dataPoints: Globals.positionStates[index].slice(0, Globals.frame + 1)
    });

    vaChart.options.data.push({
      type: "line",
      showInLegend: true,
      name: "Acceleration " + name,
      dataPoints: Globals.accelStates[index].slice(0, Globals.frame + 1)
    });

    vaChart.options.data.push({
      type: "line",
      showInLegend: true,
      name: "Velocity " + name,
      dataPoints: Globals.velocityStates[index].slice(0, Globals.frame + 1)
    });

  });

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
  $('#pointmass-properties-velocity-y').on("change", function(){ updatePropertyRedraw('vely', -1 * $('#pointmass-properties-velocity-y').val()); });
  $('#pointmass-properties-acceleration-x').on("change", function(){ updatePropertyRedraw('accx', $('#pointmass-properties-acceleration-x').val()); });
  $('#pointmass-properties-acceleration-y').on("change", function(){ updatePropertyRedraw('accy', -1 * $('#pointmass-properties-acceleration-y').val()); });
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
  $('#add-keyframe').on("click", function(event) { addKeyframe(event); } );
  
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
