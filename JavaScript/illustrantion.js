/**
 * pH Visualization with Particle Animation
 * Displays molecular particles (OH-, H3O+, H2O) whose composition changes
 * based on real-time serial sensor data (pH value)
 */

// ===== CONFIGURATION VARIABLES =====
// Sensor calibration values - adjust these based on your sensor readings
const MIN_SERIAL_VALUE = 3400;           // Sensor reading at minimum pH
const MAX_SERIAL_VALUE = 3900;           // Sensor reading at maximum pH
const MEAN_SERIAL_VALUE = 3600;          // Mid-point sensor reading (neutral pH)

// Particle system configuration
const TOTAL_PARTICLES = 50;              // Total number of particles to display
const CONSTANT_H2O = 10;                 // Number of H2O particles (always fixed)
const VARIABLE_PARTICLES = TOTAL_PARTICLES - CONSTANT_H2O;  // Number of variable particles
const CHANGE_DELAY_FRAMES = 5;           // Frames to wait before a particle can change type again
const MOLECULE_SCALE = 3;                // Scale factor for drawing molecules (1 = normal size)

// ===== STATE VARIABLES =====
let minSerialValue = MIN_SERIAL_VALUE;
let maxSerialValue = MAX_SERIAL_VALUE;
let meanSerialValue = MEAN_SERIAL_VALUE;
let particles = [];                      // Array to store all particle objects
let serialData;                          // Current sensor reading from Arduino
let socket;                              // WebSocket connection object
let lastChangedIndices = [];             // Track which particles changed last frame
let moleculeScale = MOLECULE_SCALE;

// ===== SETUP FUNCTION =====
// Initialize canvas and WebSocket connection
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Establish WebSocket connection to serial port server
  socket = new WebSocket('ws://localhost:8080');
  
  // Handle incoming serial data
  socket.onmessage = function(event) {
    serialData = parseFloat(event.data);
    serialData = constrain(serialData, minSerialValue, maxSerialValue);
    console.log("Serial Value:", serialData);
  };

  // Initialize particles with random molecule types
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    particles.push(new Particle(
      random(width), 
      random(height), 
      random(['OH-', 'H3O+', 'H2O'])
    ));
    // Allow immediate change at start
    particles[i].lastChangedFrame = -CHANGE_DELAY_FRAMES;
  }
}

// ===== MAIN DRAW LOOP =====
// Render frame: update particle types and redraw
function draw() {
  background(220);

  // Adjust particle composition based on sensor reading
  adjustParticles();

  // Update and display all particles
  for (let p of particles) {
    p.update();
    p.display();
  }
}

// ===== PARTICLE ADJUSTMENT FUNCTION =====
// Assign particle types (OH-, H3O+, H2O) based on serial sensor data
// This simulates pH changes in an aqueous solution
function adjustParticles() {
  let h3oPlusRatio = 0;
  let h2oRatio = 0;
  let ohMinusRatio = 0;
  let val = serialData;

  // Calculate ion ratios based on sensor value
  // val >= maxSerialValue: fully acidic (100% H3O+)
  // val <= minSerialValue: fully basic (100% OH-)
  // val between min and max: mixture according to position
  if (val >= maxSerialValue) {
    h3oPlusRatio = 1;
    h2oRatio = 0;
    ohMinusRatio = 0;
  } else if (val <= minSerialValue) {
    h3oPlusRatio = 0;
    h2oRatio = 0;
    ohMinusRatio = 1;
  } else if (val >= meanSerialValue) {
    // Acidic region: interpolate between neutral and acidic
    h3oPlusRatio = map(val, meanSerialValue, maxSerialValue, 0, 1);
    h3oPlusRatio = constrain(h3oPlusRatio, 0, 1);
    h2oRatio = 1 - h3oPlusRatio;
    ohMinusRatio = 0;
  } else {
    // Basic region: interpolate between neutral and basic
    ohMinusRatio = map(val, minSerialValue, meanSerialValue, 1, 0);
    ohMinusRatio = constrain(ohMinusRatio, 0, 1);
    h2oRatio = 1 - ohMinusRatio;
    h3oPlusRatio = 0;
  }

  // Calculate target number of each particle type
  let targetH3OPlus = Math.round(h3oPlusRatio * VARIABLE_PARTICLES);
  let targetH2O = Math.round(h2oRatio * VARIABLE_PARTICLES);
  let targetOHMinus = VARIABLE_PARTICLES - targetH3OPlus - targetH2O;

  // First particles are always H2O (constant water molecules)
  for (let i = 0; i < CONSTANT_H2O; i++) {
    if (particles[i].shapeType !== 'H2O') {
      particles[i].shapeType = 'H2O';
      particles[i].lastChangedFrame = frameCount;
    }
  }

  // Get list of variable particles that haven't changed recently
  let variableIndices = [];
  for (let i = CONSTANT_H2O; i < TOTAL_PARTICLES; i++) {
    // Only allow particles to change if enough frames have passed
    if (frameCount - particles[i].lastChangedFrame >= CHANGE_DELAY_FRAMES) {
      variableIndices.push(i);
    }
  }
  shuffle(variableIndices, true);

  let changedThisFrame = [];
  let count = 0;

  // Assign H3O+ (hydronium) particles
  for (let i = 0; i < targetH3OPlus && count < variableIndices.length; i++, count++) {
    let idx = variableIndices[count];
    if (particles[idx].shapeType !== 'H3O+') {
      particles[idx].shapeType = 'H3O+';
      particles[idx].lastChangedFrame = frameCount;
      changedThisFrame.push(idx);
    }
  }

  // Assign H2O (water) particles
  for (let i = 0; i < targetH2O && count < variableIndices.length; i++, count++) {
    let idx = variableIndices[count];
    if (particles[idx].shapeType !== 'H2O') {
      particles[idx].shapeType = 'H2O';
      particles[idx].lastChangedFrame = frameCount;
      changedThisFrame.push(idx);
    }
  }

  // Assign OH- (hydroxide) particles
  for (let i = 0; i < targetOHMinus && count < variableIndices.length; i++, count++) {
    let idx = variableIndices[count];
    if (particles[idx].shapeType !== 'OH-') {
      particles[idx].shapeType = 'OH-';
      particles[idx].lastChangedFrame = frameCount;
      changedThisFrame.push(idx);
    }
  }

  // Update tracking for next frame
  lastChangedIndices = changedThisFrame;
}

// ===== PARTICLE CLASS =====
// Represents a single molecule that moves and changes type
class Particle {
  constructor(x, y, shapeType) {
    this.x = x;                                  // X position
    this.y = y;                                  // Y position
    this.vx = random(-1, 1);                     // X velocity
    this.vy = random(-1, 1);                     // Y velocity
    this.size = random(10, 20);                  // Particle size
    this.shapeType = shapeType;                  // Molecule type: 'OH-', 'H3O+', or 'H2O'
    this.lastChangedFrame = -CHANGE_DELAY_FRAMES;  // Frame when type was last changed
  }

  // Update particle position and handle canvas boundaries
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off canvas edges
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  // Draw particle based on its molecule type
  display() {
    if (this.shapeType === 'OH-') {
      this.drawOHMinus();
    } else if (this.shapeType === 'H3O+') {
      this.drawH3OPlus();
    } else if (this.shapeType === 'H2O') {
      this.drawH2O();
    }
  }

  // Draw OH- (hydroxide ion): red central oxygen + white hydroxyl group
  drawOHMinus() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 30 * moleculeScale);
    fill(255);
    ellipse(this.x + 20 * moleculeScale, this.y, 15 * moleculeScale);
  }

  // Draw H3O+ (hydronium ion): red oxygen + three white hydrogen atoms at 120° angles
  drawH3OPlus() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 30 * moleculeScale);
    // Three hydrogen atoms positioned at 120° intervals
    let r = 20 * moleculeScale;
    for (let i = 0; i < 3; i++) {
      let angle = radians(120 * i);
      let x1 = this.x + r * cos(angle);
      let y1 = this.y + r * sin(angle);
      fill(255);
      ellipse(x1, y1, 15 * moleculeScale);
    }
  }

  // Draw H2O (water molecule): red oxygen + two white hydrogen atoms
  drawH2O() {
    fill(255, 0, 0);
    ellipse(this.x, this.y, 30 * moleculeScale);
    // Two hydrogen atoms at specific angles (bent configuration)
    let r = 20 * moleculeScale;
    let angle1 = radians(60);
    let angle2 = radians(180);
    let x1 = this.x + r * cos(angle1);
    let y1 = this.y + r * sin(angle1);
    let x2 = this.x + r * cos(angle2);
    let y2 = this.y + r * sin(angle2);
    fill(255);
    ellipse(x1, y1, 15 * moleculeScale);
    ellipse(x2, y2, 15 * moleculeScale);
  }
}
