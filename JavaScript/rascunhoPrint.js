/**
 * Audio Visualization with Waveform and FFT Spectrum
 * Creates real-time audio synthesis controlled by serial sensor data
 * Displays both waveform (time domain) and FFT spectrum (frequency domain)
 */

// ===== CONFIGURATION VARIABLES =====
// Sensor calibration values - adjust based on your sensor readings
const MIN_SERIAL_VALUE = 4600;           // Sensor reading at minimum
const MAX_SERIAL_VALUE = 2100;           // Sensor reading at maximum
const INITIAL_SERIAL_VALUE = 2500;       // Default sensor value

// Audio synthesis configuration
const INITIAL_NOTES = ["C4", "E5", "G5"];  // Initial chord (can be modified)
const INITIAL_FILTER_FREQ = 100;         // Starting filter frequency (Hz)
const MIN_FILTER_FREQ = 200;             // Minimum filter cutoff (Hz)
const MAX_FILTER_FREQ = 1000;            // Maximum filter cutoff (Hz)

// Waveform display settings
const WAVEFORM_BUFFER_SIZE = 1024;       // Number of samples to analyze
const WAVEFORM_AMPLITUDE_SCALE = 1.5;    // Amplitude multiplier for visualization
const WAVEFORM_SCOPE_HEIGHT_RATIO = 0.45; // Height as fraction of canvas

// ===== STATE VARIABLES =====
let minSerialValue = MIN_SERIAL_VALUE;
let maxSerialValue = MAX_SERIAL_VALUE;
let serialData = INITIAL_SERIAL_VALUE;   // Current sensor reading from Arduino
let socket;                              // WebSocket connection object
let waveformAnalyzer;                    // Tone.js analyzer for waveform data

// Audio synthesis variables
let synth;                               // Polyphonic synthesizer
let filter;                              // Low-pass filter
let notes = INITIAL_NOTES;               // Current chord notes
let filterFreq = INITIAL_FILTER_FREQ;    // Current filter frequency
let audioStarted = false;                // Flag to track audio state

// UI buttons
let startButton, stopButton;

// ===== SETUP FUNCTION =====
// Initialize canvas, WebSocket, and UI buttons
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Establish WebSocket connection to serial port server
  socket = new WebSocket("ws://localhost:8080");
  socket.onmessage = function (event) {
    // Parse and store incoming sensor data
    serialData = parseFloat(event.data);
  };

  // Create UI button to start audio playback
  startButton = createButton("Start Audio");
  startButton.position(10, 10);
  startButton.mousePressed(startAudio);

  // Create UI button to stop audio playback
  stopButton = createButton("Stop Audio");
  stopButton.position(120, 10);
  stopButton.mousePressed(stopAudio);
}

// ===== AUDIO CONTROL FUNCTIONS =====
// Initialize and start audio synthesis
function startAudio() {
  if (!audioStarted) {
    // Create polyphonic synthesizer with sine wave oscillator
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
    });

    // Create low-pass filter and connect synth to it
    filter = new Tone.Filter(filterFreq, "lowpass", -24).toDestination();
    synth.connect(filter);

    // Create waveform analyzer to capture audio output
    waveformAnalyzer = new Tone.Analyser("waveform", WAVEFORM_BUFFER_SIZE);
    filter.connect(waveformAnalyzer);

    // Start audio context and trigger chord
    Tone.start();
    synth.triggerAttack(notes);

    audioStarted = true;
    console.log("Audio started.");
  }
}

// Stop audio synthesis
function stopAudio() {
  if (audioStarted) {
    // Release all held notes
    synth.releaseAll();
    audioStarted = false;
    console.log("Audio stopped.");
  }
}

// ===== MAIN DRAW LOOP =====
// Render waveform visualization and update filter frequency
function draw() {
  background(220);

  // Only update audio if it has been started
  if (audioStarted) {
    // Map sensor data to filter frequency range
    filterFreq = map(serialData, minSerialValue, maxSerialValue, MIN_FILTER_FREQ, MAX_FILTER_FREQ);
    filterFreq = constrain(filterFreq, MIN_FILTER_FREQ, MAX_FILTER_FREQ);
    
    // Apply filter frequency to audio
    filter.frequency.value = filterFreq;

    // Display current filter frequency as text
    fill(0);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Filter (Hz): ${Math.floor(filterFreq)}`, 10, 50);

    // Get waveform data from analyzer
    const waveform = waveformAnalyzer.getValue();
    
    // Draw waveform (time-domain visualization)
    stroke(0);
    strokeWeight(10);
    noFill();
    beginShape();
    background(255);

    // Calculate waveform display dimensions
    const scopeWidth = width;
    const scopeHeight = height * WAVEFORM_SCOPE_HEIGHT_RATIO;
    const scopeXStart = 0;
    const scopeYStart = (height - scopeHeight) / 2;

    // Plot each waveform sample
    for (let i = 0; i < waveform.length; i++) {
      const x = map(i, 0, waveform.length - 1, scopeXStart, scopeXStart + scopeWidth);
      // Apply amplitude scale and map to Y coordinates
      const y = map(waveform[i] * WAVEFORM_AMPLITUDE_SCALE, -1, 1, scopeYStart + scopeHeight, scopeYStart);
      vertex(x, y);
    }

    endShape();
  }
}