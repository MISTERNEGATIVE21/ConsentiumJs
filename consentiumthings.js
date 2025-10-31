// ConsentiumThings JS helper for sending/receiving data to Consentium IoT cloud

const DEFAULT_SEND_URL = "https://api.consentiumiot.com/v2/updateData?";
const DEFAULT_RECEIVE_URL = "https://api.consentiumiot.com/getData?";

// SSL options (Node.js https.Agent) — useful if you need to supply CA or allow self-signed certs
const https = require('https');
let sslOptions = null; // e.g. { rejectUnauthorized: false } or { ca: 'PEM string' }

function setSslOptions(options) {
  sslOptions = options || null;
}

// Allow overriding the remote URLs (useful for a proxy or testing)
let overrideSendUrl = null;
let overrideReceiveUrl = null;

function setBaseUrls(sendUrl, receiveUrl) {
  overrideSendUrl = sendUrl || null;
  overrideReceiveUrl = receiveUrl || null;
}

/**
 * Send sensor data to Consentium IoT cloud.
 * @param {string} sendKey
 * @param {string} boardKey
 * @param {Array<{info:string, value:number}>} sensors
 * @param {Object} [boardInfo] optional board metadata (firmwareVersion, architecture, deviceMAC, statusOTA, signalStrength)
 * @param {number} [precision=4]
 * @returns {Promise<{ok:boolean, status:number, body?:any, error?:string}>}
 */
async function sendData(sendKey, boardKey, sensors, boardInfo = {}, precision = 4) {
  const base = overrideSendUrl || DEFAULT_SEND_URL;
  const url = `${base}sendKey=${encodeURIComponent(sendKey)}&boardKey=${encodeURIComponent(boardKey)}`;

  // Normalize MAC address (uppercase, colon-separated) if provided
  function normalizeMac(mac){
    if(!mac) return mac;
    // remove non-hex chars
    const hex = String(mac).toUpperCase().replace(/[^0-9A-F]/g, '');
    if(hex.length !== 12) return mac; // return original if unexpected length
    return hex.match(/.{1,2}/g).join(':');
  }
  if (boardInfo && boardInfo.deviceMAC) boardInfo.deviceMAC = normalizeMac(boardInfo.deviceMAC);

  const payload = {
    sensors: {
      sensorData: sensors.map(s => ({
        info: s.info,
        data: Number(s.value).toFixed(precision)
      }))
    },
    boardInfo: {
      firmwareVersion: boardInfo.firmwareVersion || "0.0",
      architecture: boardInfo.architecture || "unknown",
  deviceMAC: boardInfo.deviceMAC || "00:00:00:00:00:00",
      statusOTA: !!boardInfo.statusOTA,
      signalStrength: boardInfo.signalStrength || 0
    }
  };

  try {
    const fetchOpts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    };

    // If we're in Node and sslOptions were set, attach an https.Agent for secure fetch
    if (sslOptions && url.startsWith('https:')) {
      fetchOpts.agent = new https.Agent(sslOptions);
    }

    const res = await fetch(url, fetchOpts);

    const bodyText = await res.text();
    let body = bodyText;
    try { body = JSON.parse(bodyText); } catch (e) { /* keep raw text */ }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    const hint = (typeof err.message === 'string' && err.message.toLowerCase().includes('failed to fetch'))
      ? 'Failed to fetch — network or CORS issue when called from a browser. Use server-side call or a proxy.'
      : err.message;
    return { ok: false, status: 0, error: hint };
  }
}

/**
 * Fetch recent data from Consentium IoT cloud.
 * @param {string} receiveKey
 * @param {string} boardKey
 * @param {boolean} [recents=true]
 * @returns {Promise<{ok:boolean, status:number, feeds?:Array<{info:string, value:number}>, body?:any, error?:string}>}
 */
async function receiveData(receiveKey, boardKey, recents = true) {
  const base = overrideReceiveUrl || DEFAULT_RECEIVE_URL;
  const url = `${base}recents=${recents ? "true" : "false"}&receiveKey=${encodeURIComponent(receiveKey)}&boardKey=${encodeURIComponent(boardKey)}`;

  try {
    const fetchOpts = { method: "GET" };
    if (sslOptions && url.startsWith('https:')) fetchOpts.agent = new https.Agent(sslOptions);

    const res = await fetch(url, fetchOpts);
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { json = null; }

    if (!json) {
      return { ok: res.ok, status: res.status, body: text };
    }

    // Convert response into array similar to pullData() result
    // Each feed may contain values value1..value8 and board info has info1..info8
    const board = json.board || {};
    const feeds = json.feeds || [];
    const result = [];

    for (const feed of feeds) {
      for (let i = 1; i <= 8; i++) {
        const infoKey = `info${i}`;
        const valueKey = `value${i}`;
        if (board[infoKey] !== undefined && feed[valueKey] !== undefined) {
          result.push({ info: board[infoKey], value: Number(feed[valueKey]) });
        }
      }
    }

    return { ok: res.ok, status: res.status, feeds: result, body: json };
  } catch (err) {
    const hint = (typeof err.message === 'string' && err.message.toLowerCase().includes('failed to fetch'))
      ? 'Failed to fetch — network or CORS issue when called from a browser. Use server-side call or a proxy.'
      : err.message;
    return { ok: false, status: 0, error: hint };
  }
}

module.exports = { sendData, receiveData, setBaseUrls, setSslOptions };