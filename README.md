# Low-Cost Optrode - Assistive Technology for Flexible Representation of Chemical Visual Indicators

DOI:

This project consist of a low-cost optrode based on out-the-shelf LEDs, for measure chemical visual indicators
transmittance to adapt the color changing to others stimuli.

## Components

- **Optrode**: Colorimetric sensor that will be immersed in solution to measure the color changing. 
   - *files*: 3D model (.stl), circuit diagram (.jpeg).
- **Arduino**: Microcontroller responsible to measure the LED photovoltage, proportional to color intensity, and realize a digital filtering.
   - *files*: Code (.ino).
- **JavaScript**: Application responsible to communicate with the Arduino board and transform the color data in other stimuli.
   - **server.js**: Read serial port data in real time.
   - **sound.js**: Modulate a C-major chord.
   - **illustration.js**: Modulate proportion of OH⁻, H₃O⁺, H₂O molecules illustrated.

## Other files

```
├── index.html               # Main HTML entry point
├── package.json             # Node.js dependencies
└── README.md                # This file
```

## Requirements

### Software
- Node.js (v14 or higher)
- Web browser with WebSocket support (Chrome, Firefox, Safari, Edge)
- npm (Node Package Manager)

## Installation

### 1. Install Dependencies
```bash
npm install
```

This installs:
- `ws`: WebSocket server library
- `serialport`: Arduino serial port communication

### 2. Configure Serial Port
Edit `server.js` and update these variables to match your setup:
```javascript
const SERIAL_PORT_PATH = 'COM3';        // Change to your Arduino port (COM3, COM4, etc. on Windows)
const SERIAL_BAUD_RATE = 9600;          // Match your Arduino baud rate
```

**Finding your Arduino port:**
- **Windows**: Device Manager → Ports (COM & LPT) → Look for Arduino COM port
- **macOS**: `ls /dev/tty.*` in terminal (usually `/dev/tty.usbserial-*`)
- **Linux**: `ls /dev/tty*` in terminal (usually `/dev/ttyUSB0` or `/dev/ttyACM0`)

### 3. Start the Server
```bash
npm start
```

The server will start on `ws://localhost:8080`

### 4. Open Visualization in Browser
```
http://localhost:3000
```
(Or open `index.html` directly if not using a web server)

## Configuration

### Sensor Calibration
Each visualization file has configurable constants at the top that control behavior:

**rascunho3.js (Particle Visualization)**
```javascript
const MIN_SERIAL_VALUE = 3400;           // Sensor value at acidic end
const MAX_SERIAL_VALUE = 3900;           // Sensor value at basic end
const MEAN_SERIAL_VALUE = 3600;          // Neutral pH point
```

**rascunhoPrint.js & rascunhoI3.js (Audio Visualization)**
```javascript
const MIN_SERIAL_VALUE = 4600;           // Sensor value for min frequency
const MAX_SERIAL_VALUE = 2100;           // Sensor value for max frequency
const MIN_FILTER_FREQ = 200;             // Minimum filter frequency (Hz)
const MAX_FILTER_FREQ = 1000;            // Maximum filter frequency (Hz)
```

### Customizing Visualizations

Edit these constants to modify behavior:

| Variable | Effect |
|----------|--------|
| `TOTAL_PARTICLES` | Number of particles to display (higher = more CPU usage) |
| `CONSTANT_H2O` | Number of fixed water molecules (pH-independent) |
| `MOLECULE_SCALE` | Size multiplier for particle drawing |
| `INITIAL_NOTES` | Starting chord (e.g., `["C4", "E5", "G6"]`) |
| `MIN_FILTER_FREQ` | Lowest audio cutoff frequency |
| `MAX_FILTER_FREQ` | Highest audio cutoff frequency |

## Usage Guide

### Particle Animation (rascunho3.js)
1. Open `index.html` in a browser
2. Particles represent molecules in solution
3. Particle composition changes based on pH:
   - **Acidic (right)**: More H₃O⁺ (hydronium) - 3 white atoms
   - **Neutral (center)**: Mix of H₂O and ions
   - **Basic (left)**: More OH⁻ (hydroxide) - 1 white atom
4. Red circles = Oxygen, White circles = Hydrogen

### Audio Visualization (rascunhoPrint.js)
1. Click "Start Audio" to begin synthesis
2. Audio frequency changes based on sensor reading
3. Display shows:
   - Current filter frequency (Hz)
   - Real-time waveform in the upper half
4. Click "Stop Audio" to stop

### Advanced Audio + FFT (rascunhoI3.js)
1. Click "Start Audio" to begin
2. Display shows:
   - Current filter frequency at top
   - **Upper half**: Waveform (time-domain signal)
   - **Lower half**: FFT spectrum (frequency-domain analysis)
3. Click "Save FFT to CSV" to export frequency data for analysis

## Data Format

### Incoming Serial Data
- Format: ASCII numbers separated by newlines (e.g., `3650\n3651\n3649\n`)
- Range: Configurable in each visualization file
- Update rate: Depends on Arduino sketch (typically 10-100 Hz)

### CSV Export Format (FFT)
```
Frequency (Hz),Magnitude
0.0,25.5
43.0,12.3
86.0,8.9
...
```

## Troubleshooting

### Server won't start
- Ensure Node.js is installed: `node --version`
- Check port 8080 is not in use by another application
- Verify serial port path is correct

### No data appearing in visualization
- Check Arduino is connected and powered
- Verify serial port path in `server.js`
- Check Arduino is sending data (test with Arduino IDE Serial Monitor)
- Open browser console (F12) to check for errors

### Audio not working
- Click "Start Audio" button (browser requires user interaction to play audio)
- Check browser allows audio playback
- Verify system volume is turned up

### WebSocket connection failed
- Ensure `server.js` is running
- Check firewall allows localhost connection
- Verify WebSocket URL matches server port

## File Descriptions

### server.js
Node.js WebSocket server that:
- Listens on serial port for Arduino data
- Broadcasts incoming data to all connected web clients
- Handles multiple simultaneous connections
- Auto-reconnects if connection drops

### rascunho3.js
p5.js sketch displaying pH as particle composition:
- Fixed water molecules stay H₂O
- Variable particles change type (H₂O ↔ H₃O⁺ ↔ OH⁻)
- Particles bounce around screen with physics
- Color-coded by molecule type

### rascunhoPrint.js
Simple audio visualization showing:
- Real-time waveform display
- Filter frequency modulation by sensor
- Single waveform analyzer
- Lightweight visualization

### rascunhoI3.js
Advanced audio visualization with:
- Dual analyzers (waveform + FFT)
- Split-screen display (waveform top, spectrum bottom)
- CSV export of FFT data
- Higher computational load but more information

## Tips for Best Results

1. **Calibration**: Measure sensor values at known pH levels and update constants
2. **Performance**: Reduce `TOTAL_PARTICLES` if animation is laggy
3. **Audio Quality**: Higher `ANALYZER_BUFFER_SIZE` = better frequency resolution but higher latency
4. **Sampling**: Send data at 50-100 Hz for smooth visualization
5. **Filtering**: Add Arduino-side low-pass filter for noisy sensors

## License

ISC

## Authors

Contributors: Low-cost Optrode Project Team

---

For questions or issues, please check the troubleshooting section or consult the inline code comments for more details.
