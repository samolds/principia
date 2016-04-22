/*
  globals.js -- 
  This file contains all variables meant for general use by any physics module and contains
  the simulator's global state
*/
var Globals = {

  // Current PhysicJS world
  world: {},  

  // For each body, stores a map of constants associated with the body
  // Constant values apply to every keyframe
  bodyConstants: [],

  // Currently selected frame in range
  frame: 0,

  // Interval event that allows for animation
  anim: {},

  // Flag indicating that the timeline is ready for a user to play/pause/scrub
  timelineReady: true,

  // Flag for when simulator is currently running
  running: false,

  // Saved information for scrubbing through simulation
  // states[0] will always match keyframeStates[0]
  // states contains one array per frame, which contains one PhysicsJS body.state object per body in the simulation
  // These values are not canonical. They depend on the camera position and screen size
  states: [],

  // Position values for the position line graph
  positionStates: [],

  // Velocity values for the velocity line graph
  velocityStates: [],

  // Acceleration values for the acceleration line graph
  accelStates: [],

  // Currently selected keyframe index (without respect to timeline/states frames), false if not on keyframe
  keyframe: 0,
  
  // State at each keyframe (One inner array per keyframe, COUNT(bodies) state entries per inner array)
  // These values are not canonical. They depend on the camera position and screen size
  keyframeStates: [[]],

  // Time associated with each keyframe (false if unknown)
  keyframeTimes: [0],

  // Index of key frames within timeline (false if not associated with timeline frame yet)
  keyframes: [0],

  // Number of keyframes for current simulation
  numKeyframes: 1,
  
  // Number of frames in current simulation
  totalFrames: 0,

  // Id associated with canvas element used for rendering
  canvasId: "viewport",

  // If a move event is fired after a grab event, raise flag to inform release event
  didMove: false,
    
  // Currently selected body, false if none
  selectedBody: false,

  // For each keyframe:
  // A list of bodies and their associated variable values
  // Variable values are CANONICAL: they contain the true coordinates irrespective of camera location and screen size
  variableMap: [[]],

  // Equation solver for currently loaded module
  // Current approach: Using eq-solver library, which uses eval function and map of variables to equations used to solve them
  // Generate frames when there are no unknowns left, gives up if an iteration doesn't update any variables
  solver: false,

  // Force of gravity in [x,y]
  gravity: [0,0],

  // Zero-point for this simulation, object coordinates are displayed relative to this point
  // Internally, still use PhysicsJS default coordinate system (0 is upper-left, y-axis is down)
  origin: [0, 0],
  
  // False if the origin is a fixed point, otherwise the origin moves along with the object stored in this variable
  originObject: false,
  
  // Coordinate system currently used (cartesian or polar)
  coordinateSystem: "cartesian",

  // Counters used for each body (used to assign default nicknames)
  massBodyCounter: 0,
  pulleyBodyCounter: 0,
  surfaceBodyCounter: 0,
  rampBodyCounter: 0,
  springBodyCounter: 0,

  // Flags for keys being held down or that vectors have been updated
  vDown: false,
  aDown: false,
  vChanging: false,

  // Free Body Diagram Globals
  // Tells us if the simulator was running when the fbd was displayed
  fbdDown: false,
  fbdWasRunning: false,

  // Flag for loading in progress
  loading: false,
  
  // Scale factor in clicks (display only, the canvas should be zoomed in by 2^scale)
  scale: 0,
      
  // -- CONSTANTS -- \\
  // Controls speed of frame change while animating
  delay: 250,  

  // Factor to multiply displayed lengths by
  lengthFactor: 1.0,
  
  // Factor to multiply displayed times by
  timeFactor: 1.0,
  
  // Number of keyframes for current simulation
  numKeyframes: 1,
  
  // Displayed precision (Under the hood, maintains default precision)
  dPrecision: 3,
  
  // Number of pixels within range for attaching objects (for springs, moving origin, pulleys)
  delta: 50,
  
  // Minimum and maximum scale factor clicks
  minScale: -2,  
  maxScale: 3,
  
  // Paths to images used for drawing point mass
  massImages: [
              "/static/img/toolbox/roundmass.png",
              "/static/img/toolbox/squaremass.png",
              "/static/img/toolbox/weight.png",
              "/static/img/toolbox/car.png",
              "/static/img/toolbox/sailboat.png",
              "/static/img/toolbox/speedboat.png",
              "/static/img/toolbox/mascot.png",
              "/static/img/toolbox/tranquilizer.png",
              "/static/img/toolbox/jogger.png",
              "/static/img/toolbox/rocket.png",
              "/static/img/team/dalton.png",
              "/static/img/team/danny.png",
              "/static/img/team/matthew.png",
              "/static/img/team/sam.png",
              "/static/img/logo/logo.png",
              ],

  // Number of frames to attempt to simulate
  maxFrames: 1000,
  
  // Maximum number of keyframes
  maxNumKeyframes: 5,
  
  // Maximum number of bodies
  maxNumBodies: 20,

  // Last position of cursor when panning
  lastPos: {x: 0, y: 0},
  
  // Flag raised when panning is in progress
  isPanning: false,

  // The sum total of how the camera has been adjusted by panning
  translation: {x: 0, y: 0}
};

//context menu 
var menu = document.querySelector("#context-menu");
var menuState = 0;
var active = "context-menu--active";
