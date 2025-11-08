/**
 * consentiumthings.js
 * * A JavaScript client library for interacting with the Consentium IoT Sensor Data API (v2).
 * This file provides helper functions to submit data and retrieve data from the API.
 */

// Base URL for the Consentium IoT API
const API_BASE_URL = "https://api.consentiumiot.com";

/**
 * Submits sensor and board data to the Consentium IoT platform.
 * This function constructs the required data payload from individual arguments.
 * Corresponds to the 'POST /v2/updateData' endpoint.
 *
 * @param {string} sendKey - The write-access key for the board.
 * @param {string} boardKey - The unique identifier for the board.
 * @param {Array<object>} sensorArray - An array of sensor reading objects. 
 * Example: [{ info: "Temperature", data: "40.00" }, { info: "Humidity", data: "90.00" }]
 * @param {string} macAddress - The physical MAC address of the device (e.g., "DD:DA:0C:20:E1:41").
 * @param {string} architecture - Device architecture (e.g., "ESP32").
 * @param {string} firmwareVersion - Firmware version (e.g., "1.0.0").
 * @param {boolean} [statusOTA=false] - (Optional) Over-the-Air update status. Defaults to false.
 * @param {number | null} [signalStrength=null] - (Optional) WiFi signal strength. Defaults to null.
 * @returns {Promise<object>} A promise that resolves to the JSON response from the API.
 * @throws {Error} Throws an error if the network request fails or the API returns a non-200 status.
 */
async function submitSensorData(sendKey, boardKey, sensorArray, macAddress, architecture, firmwareVersion, statusOTA = false, signalStrength = null) {
    
    // Construct the payload structure required by the API
    const dataPayload = {
        sensors: {
            sensorData: sensorArray 
        },
        boardInfo: {
            firmwareVersion: firmwareVersion,
            architecture: architecture,
            statusOTA: statusOTA,
            deviceMAC: macAddress,
            signalStrength: signalStrength
        }
    };

    // Filter out null signalStrength if it wasn't provided, as the API might not accept null.
    if (signalStrength === null) {
        delete dataPayload.boardInfo.signalStrength;
    }

    const endpoint = `${API_BASE_URL}/v2/updateData?sendKey=${encodeURIComponent(sendKey)}&boardKey=${encodeURIComponent(boardKey)}`;
    
    console.log(`Submitting data to: ${endpoint}`);
    console.log("Payload:", JSON.stringify(dataPayload, null, 2)); // Log the constructed payload
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataPayload),
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Log the error response from the API
            console.error('API Error:', response.status, responseData);
            throw new Error(`API request failed with status ${response.status}: ${responseData.message || response.statusText}`);
        }

        console.log('Data submitted successfully:', responseData);
        return responseData;

    } catch (error) {
        console.error('Error in submitSensorData:', error.message);
        throw error; // Re-throw the error for the caller to handle
    }
}

/**
 * Retrieves all historical data feeds for a specific board.
 * Corresponds to the 'GET /getData' endpoint.
 *
 * @param {string} receiveKey - The read-access key for the board.
 * @param {string} boardKey - The unique identifier for the board.
 * @returns {Promise<object>} A promise that resolves to the JSON response (board info and feeds).
 * @throws {Error} Throws an error if the network request fails or the API returns a non-200 status.
 */
async function getHistoricalData(receiveKey, boardKey) {
    const endpoint = `${API_BASE_URL}/getData?receiveKey=${encodeURIComponent(receiveKey)}&boardKey=${encodeURIComponent(boardKey)}`;
    
    console.log(`Fetching historical data from: ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('API Error:', response.status, responseData);
            throw new Error(`API request failed with status ${response.status}: ${responseData.message || response.statusText}`);
        }

        console.log('Historical data retrieved:', responseData);
        return responseData;

    } catch (error) {
        console.error('Error in getHistoricalData:', error.message);
        throw error;
    }
}

/**
 * Retrieves only the most recent data feed for a specific board.
 * Corresponds to the 'GET /getData?recents=true' endpoint.
 *
 * @param {string} receiveKey - The read-access key for the board.
 * @param {string} boardKey - The unique identifier for the board.
 * @returns {Promise<object>} A promise that resolves to the JSON response (board info and the latest feed).
 * @throws {Error} Throws an error if the network request fails or the API returns a non-200 status.
 */
async function getRecentData(receiveKey, boardKey) {
    const endpoint = `${API_BASE_URL}/getData?recents=true&receiveKey=${encodeURIComponent(receiveKey)}&boardKey=${encodeURIComponent(boardKey)}`;
    
    console.log(`Fetching recent data from: ${endpoint}`);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('API Error:', response.status, responseData);
            throw new Error(`API request failed with status ${response.status}: ${responseData.message || response.statusText}`);
        }

        console.log('Recent data retrieved:', responseData);
        return responseData;

    } catch (error) {
        console.error('Error in getRecentData:', error.message);
        throw error;
    }
}

/**
 * Example usage (demonstration).
 * Do not run this directly with real keys in a public environment.
 * You would import these functions into your main application script.
 */
async function runDemo() {
    console.log("--- Consentium IoT API Test ---");

    // --- DUMMY KEYS AND DATA (REPLACE WITH REAL ONES) ---
    const DEMO_SEND_KEY = "<YOUR-SEND-KEY>";
    const DEMO_RECEIVE_KEY = "<YOUR-RECEIVE-KEY>";
    const DEMO_BOARD_KEY = "<YOUR-BOARD-KEY>";

    // --- New way to call submitSensorData ---
    // Here are 5 sensor elements as requested
    const mySensorReadings = [
        { "info": "Temperature", "data": "25.50" },
        { "info": "Humidity", "data": "60.00" },
        { "info": "Pressure", "data": "1012.5" },
        { "info": "Light", "data": "300" },
        { "info": "SoilMoisture", "data": "45.0" }
    ];
    const myMac = "AA:BB:CC:11:22:33";
    const myArch = "ESP32";
    const myFwVersion = "1.0.1";
    const mySignal = -60;
    
    // Check if keys are placeholders
    if (DEMO_SEND_KEY.includes("<YOUR")) {
        console.warn("Please replace placeholder keys in consentiumthings.js to run the demo.");
        return;
    }
    
    try {
        // 1. Submit Data (using the new function signature)
        console.log("\nAttempting to submit data...");
        const submitResult = await submitSensorData(
            DEMO_SEND_KEY, 
            DEMO_BOARD_KEY, 
            mySensorReadings, 
            myMac, 
            myArch, 
            myFwVersion,
            false, // statusOTA (optional, defaults to false)
            mySignal // signalStrength (optional, defaults to null)
        );
        console.log("Submit result:", submitResult);

        // 2. Get Recent Data
        console.log("\nAttempting to get recent data...");
        const recentResult = await getRecentData(DEMO_RECEIVE_KEY, DEMO_BOARD_KEY);
        console.log("Recent data:", JSON.stringify(recentResult, null, 2));

        // 3. Get Historical Data
        console.log("\nAttempting to get historical data...");
        const historicalResult = await getHistoricalData(DEMO_RECEIVE_KEY, DEMO_BOARD_KEY);
        console.log("Historical data:", JSON.stringify(historicalResult, null, 2));

    } catch (error) {
        console.error("\n--- DEMO FAILED ---");
        console.error(error.message);
    }
}

// To use these functions in another JS file (e.g., in Node.js or a module-supporting browser environment):
// export { submitSensorData, getHistoricalData, getRecentData };
//
// To run the demo, you would call runDemo()
// runDemo(); // Uncomment to run demo (make sure to add your keys)