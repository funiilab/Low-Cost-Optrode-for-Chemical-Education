/**
 * Advanced Audio Visualization with Waveform and FFT Analysis
 * Comprehensive audio visualization including waveform display,
 * FFT spectrum analysis, and CSV export functionality
 */

// ===== CONFIGURATION VARIABLES =====
// Sensor calibration values - adjust based on your sensor readings
const MIN_SERIAL_VALUE = 1600;           // Sensor reading at minimum
const MAX_SERIAL_VALUE = 5050;           // Sensor reading at maximum
const INITIAL_SERIAL_VALUE = 2500;       // Default sensor value

// Audio synthesis configuration
const INITIAL_NOTES = ["C4", "E5", "G6"];  // Initial chord
const INITIAL_FILTER_FREQ = 100;         // Starting filter frequency (Hz)
const MIN_FILTER_FREQ = 200;             // Minimum filter cutoff (Hz)
const MAX_FILTER_FREQ = 2200;            // Maximum filter cutoff (Hz) - more intense modulation

// Analyzer settings
const ANALYZER_BUFFER_SIZE = 1024;       // FFT buffer size
const FFT_DISPLAY_RATIO = 0.1;           // Display first 1/10th of FFT data

// ===== STATE VARIABLES =====
let minSerialValue = MIN_SERIAL_VALUE;
let maxSerialValue = MAX_SERIAL_VALUE;
let serialData = INITIAL_SERIAL_VALUE;   // Current sensor reading from Arduino
let socket;                              // WebSocket connection object

// Tone.js audio analyzers
let waveformAnalyzer;                    // Analyzer for time-domain waveform data
let fftAnalyzer;                         // Analyzer for frequency-domain FFT data

// Audio synthesis variables
let synth;                               // Polyphonic synthesizer
let filter;                              // Low-pass filter
let notes = INITIAL_NOTES;               // Current chord notes
let filterFreq = INITIAL_FILTER_FREQ;    // Current filter frequency
let audioStarted = false;                // Flag to track audio state

// UI buttons
let startButton, stopButton, saveFFTButton;

// ===== SETUP FUNCTION =====
// Initialize canvas, WebSocket, and UI buttons
function setup() {
  createCanvas(windowWidth, windowHeight);

  // Establish WebSocket connection to serial port server
  socket = new WebSocket('ws://localhost:8080');
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

  // Create UI button to export FFT data to CSV
  saveFFTButton = createButton("Save FFT to CSV");
  saveFFTButton.position(230, 10);
  saveFFTButton.mousePressed(saveFFTToCSV);
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

    // Create analyzers for waveform and FFT analysis
    waveformAnalyzer = new Tone.Analyser("waveform", ANALYZER_BUFFER_SIZE);
    fftAnalyzer = new Tone.Analyser("fft", ANALYZER_BUFFER_SIZE);
    
    // Connect filter output to both analyzers
    filter.connect(waveformAnalyzer);
    filter.connect(fftAnalyzer);

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

// ===== DATA EXPORT FUNCTION =====
// Export FFT spectrum data to CSV file for external analysis
function saveFFTToCSV() {
  // Get FFT data from analyzer
  const fft = fftAnalyzer.getValue();
  
  // Use only the first portion of FFT data (rest is redundant)
  const fftLength = Math.floor(fft.length * FFT_DISPLAY_RATIO);

  // Create CSV header
  let csvContent = "Frequency (Hz),Magnitude\n";
  
  // Calculate frequency resolution of FFT bins
  const sampleRate = Tone.context.sampleRate;
  const binSize = sampleRate / fft.length;

  // Add each FFT bin to CSV
  for (let i = 0; i < fftLength; i++) {
    const frequency = i * binSize;  // Convert bin index to frequency
    const magnitude = fft[i];        // Magnitude at this frequency
    csvContent += `${frequency},${magnitude}\n`;
  }

  // Create downloadable file
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fft_spectrum_${Date.now()}.csv`;  // Filename with timestamp
  a.click();
  URL.revokeObjectURL(url);

  console.log("FFT spectrum saved to CSV.");
}

// ===== MAIN DRAW LOOP =====
// Render waveform and FFT visualizations, update filter frequency
function draw() {
  background(220);

  // Only update if audio has been started
  if (audioStarted) {
    // Map sensor data to filter frequency range
    filterFreq = map(serialData, minSerialValue, maxSerialValue, MIN_FILTER_FREQ, MAX_FILTER_FREQ);
    filterFreq = constrain(filterFreq, MIN_FILTER_FREQ, MAX_FILTER_FREQ);
    filter.frequency.value = filterFreq;

    // Display current filter frequency as text
    fill(0);
    textSize(20);
    textAlign(LEFT, TOP);
    text(`Filter (Hz): ${Math.floor(filterFreq)}`, 10, 50);

    // ===== WAVEFORM VISUALIZATION (Time Domain) =====
    // Get waveform data from analyzer
    const waveform = waveformAnalyzer.getValue();
    
    stroke(0);
    noFill();
    beginShape();

    // Calculate waveform display dimensions (top half of canvas)
    const scopeWidth = width;
    const scopeHeight = height / 2;

    // Plot each waveform sample
    for (let i = 0; i < waveform.length; i++) {
      const x = map(i, 0, waveform.length - 1, 0, scopeWidth);
      const y = map(waveform[i], -1, 1, scopeHeight, 0);  // Map to top half
      vertex(x, y);
    }
    endShape();

    // ===== FFT VISUALIZATION (Frequency Domain) =====
    // Get FFT data from analyzer
    const fft = fftAnalyzer.getValue();
    
    stroke(0);
    strokeWeight(2);
    noFill();
    beginShape();

    // Calculate FFT display dimensions (bottom half of canvas)
    const fftYStart = height / 2;
    const fftHeight = height / 2;

    // Display only first portion of FFT (rest is redundant/aliased)
    const fftLength = Math.floor(fft.length / 10);
    const fftStartX = (width - scopeWidth) / 2;

    // Plot each FFT bin
    for (let i = 0; i < fftLength; i++) {
      const x = map(i, 0, fftLength - 1, fftStartX, fftStartX + scopeWidth);
      const y = map(fft[i], -100, 0, fftYStart + fftHeight, fftYStart);  // FFT values in dB
      vertex(x, y);
    }
    endShape();
  }
}

