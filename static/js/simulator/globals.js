/*
  This file contains all variables meant for general use by any physics module.
*/
var Globals = {
  
  // Indicates whether to use the keyframe system (enables solving for unknowns) or
  // just simulate the maximum number of frames using only known values
  useKeyframes: false,
  
  // Current PhysicJS world
  world: {},  
  
  // For each body, stores a map of constants associated with the body
  // Constant values apply to every keyframe
  bodyConstants: [],
  
  // Currently selected frame in range
  frame: 0,
  
  // Currently selected keyframe (without respect to simulation frames)
  keyframe: 0,
  
  // Controls speed of frame change while animating
  delay: 250,
  
  // Interval event that allows for animation
  anim: {},
  
  // Flag indicating that the timeline is ready for a user to play/pause/scrub
  timelineReady: false,
 
  // Flag for when simulator is currently running
  running: false,
    
  // Saved information for scrubbing through simulation
  // states[0] will always match keyframeStates[0]
  states: [],
  
  // State at each keyframe (One inner array per keyframe)
  keyframeStates: [[],[]],
  
  // Time associated with each keyframe (false if unknown)
  keyframeTimes: [0, false],
  
  // Index of key frames within states (false if not associated with "real" frame yet)
  keyframes: [0, false],
  
  // Number of frames in current simulation
  totalFrames: 0,
  
  // Number of frames to attempt to simulate before declaring simulation failure if keyframes don't match
  maxFrames: 4000,
  
  // Id associated with canvas element used for rendering
  canvasId: "viewport",
  
  // If a move event is fired after a grab event, raise flag to inform release event
  didMove: false,
  
  // Currently selected body, false if none
  selectedBody: false,
  
  // Variables associated with each body:
  // Each body has:
  // x0, xf, v0, vf, a (for kinematics, need to update later with y values plus other unknowns?)
  variableMap: [],
  
  // For each body, contains a 2-array indicating whether to draw velocity and/or acceleration vectors
  vectorDrawing: [],
  
  // Equation solver for currently loaded module
  // Current approach: Using eq-solver library, which uses eval function and map of variables to equations used to solve them
  // Generate frames when there are no unknowns left, gives up if an iteration doesn't update any variables
  solver: false,
  
  // Force of gravity in [x,y]
  gravity: [0,0],
  
  // Function used to determine if the user is allowed to edit an existing component
  canEdit: function() { return true; }, 
  
  // Function used to determine if the user is allowed to add a new component
  canAdd: function() { return true; }
};
