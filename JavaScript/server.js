/**
 * Serial Port to WebSocket Server
 * This server bridges Arduino serial data to web clients via WebSocket
 * allowing real-time sensor data visualization in the browser
 */

const WebSocket = require('ws');
const { SerialPort, ReadlineParser } = require('serialport');

// ===== CONFIGURATION VARIABLES =====
// Serial port settings
const SERIAL_PORT_PATH = 'COM5';        // Serial port path (change to your Arduino port)
const SERIAL_BAUD_RATE = 9600;          // Baud rate for serial communication
const SERIAL_DELIMITER = '\n';           // Line delimiter for serial data

// WebSocket server settings
const WEBSOCKET_PORT = 8080;             // WebSocket server port

// ===== SERIAL PORT CONFIGURATION =====
// Initialize serial port connection
const port = new SerialPort({ 
    path: SERIAL_PORT_PATH, 
    baudRate: SERIAL_BAUD_RATE 
});

// Create a readline parser to split incoming data by newline
const parser = port.pipe(new ReadlineParser({ delimiter: SERIAL_DELIMITER }));

// ===== WEBSOCKET SERVER SETUP =====
// Initialize WebSocket server
const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

console.log(`WebSocket server running on ws://localhost:${WEBSOCKET_PORT}`);
console.log(`Listening for serial data on ${SERIAL_PORT_PATH} at ${SERIAL_BAUD_RATE} baud`);

// ===== CONNECTION HANDLER =====
// Handle new WebSocket client connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Listen for incoming serial data and forward to WebSocket clients
    parser.on('data', (data) => {
        // Check if connection is open before sending
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(data.trim());  // Send trimmed data to client
        }
        console.log('Serial data:', data);
    });
    
    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});