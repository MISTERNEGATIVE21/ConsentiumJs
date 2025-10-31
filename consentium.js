
const DEFAULT_SEND_URL = "https://api.consentiumiot.com/v2/updateData?";
const DEFAULT_RECEIVE_URL = "https://api.consentiumiot.com/getData?";

 
let proxyBase = '/api'; // e.g. '/api' or 'http://localhost:3000/api'

function setProxy(baseUrl) {
  proxyBase = baseUrl || null;
}

async function sendData(sendKey, boardKey, sensors, boardInfo = {}, precision = 4) {
  // If a proxyBase is configured, call the proxy endpoint instead of the remote API
  const url = proxyBase
    ? `${proxyBase.replace(/\/$/, '')}/send`
    : `${DEFAULT_SEND_URL}sendKey=${encodeURIComponent(sendKey)}&boardKey=${encodeURIComponent(boardKey)}`;
  // Normalize MAC address for consistency
  function normalizeMac(mac){
    if(!mac) return mac;
    const hex = String(mac).toUpperCase().replace(/[^0-9A-F]/g, '');
    if(hex.length !== 12) return mac;
    return hex.match(/.{1,2}/g).join(':');
  }
  if (boardInfo && boardInfo.deviceMAC) boardInfo.deviceMAC = normalizeMac(boardInfo.deviceMAC);

  const payload = {
    sensors: {
      sensorData: sensors.map(s => ({ info: s.info, data: Number(s.value).toFixed(precision) }))
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
    const opts = proxyBase
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sendKey, boardKey, sensors, boardInfo }) }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) };

    const res = await fetch(url, opts);
    const txt = await res.text();
    let body = txt;
    try { body = JSON.parse(txt); } catch (e) { /* keep raw */ }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    // Give a friendly hint in the browser when fetch fails: often CORS or network
    const hint = (typeof err.message === 'string' && err.message.toLowerCase().includes('failed to fetch'))
      ? 'Failed to fetch — this may be a CORS issue in the browser. Try using a same-origin proxy (setProxy) or run server-side.'
      : err.message;
    return { ok: false, status: 0, error: hint };
  }
}

async function receiveData(receiveKey, boardKey, recents = true) {
  const url = proxyBase
    ? `${proxyBase.replace(/\/$/, '')}/receive?receiveKey=${encodeURIComponent(receiveKey)}&boardKey=${encodeURIComponent(boardKey)}&recents=${recents ? 'true' : 'false'}`
    : `${DEFAULT_RECEIVE_URL}recents=${recents ? "true" : "false"}&receiveKey=${encodeURIComponent(receiveKey)}&boardKey=${encodeURIComponent(boardKey)}`;
  try {
    const res = await fetch(url, { method: "GET" });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch (e) { json = null; }
    if (!json) return { ok: res.ok, status: res.status, body: text };

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
      ? 'Failed to fetch — likely a CORS/preflight block. Configure a same-origin proxy with setProxy() or run server-side code.'
      : err.message;
    return { ok: false, status: 0, error: hint };
  }
}

// Expose for browser
if (typeof window !== 'undefined') {
  window.consentium = { sendData, receiveData, setProxy };
}

// CommonJS export for Node (if used)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sendData, receiveData, setProxy };
}
