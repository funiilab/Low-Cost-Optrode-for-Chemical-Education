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
   - **index.html**: Main HTML entry point
   - **package.json**: Node.js dependencies

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
1. Open `index.html` in a text editor
2. Change the `.js` file in the line 13 (illustration.js or sound.js)
3. `Ctrl + S` to save
4. Open `index.html` in a browser

## Authors

Contributors: Takahara dos Santos and Gabriel N. Meloni

---

For questions or issues, please check the troubleshooting section or consult the inline code comments for more details.
