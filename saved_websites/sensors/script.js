// --- script.js ---
// Sensor Utility Functions
function setStatus(id, status, isError = false) {
  const el = document.getElementById(id);
  el.textContent = status;
  el.className = 'sensor-status' + (isError ? ' error' : '');
}
function setValue(id, val, decimals = 2) {
  document.getElementById(id).textContent = (typeof val === 'number' ? val.toFixed(decimals) : val);
}

// Generic Sensor API helpers
function safeSensorStart(SensorClass, readingsCallback, options = {}, onError, onNoSensor) {
  try {
    if (!SensorClass) throw new Error('Unavailable');
    const sensor = new SensorClass(options);
    sensor.addEventListener('reading', () => readingsCallback(sensor));
    sensor.addEventListener('error', e => {
      onError && onError(e);
    });
    sensor.start();
    return sensor;
  } catch (e) {
    onNoSensor && onNoSensor(e);
    return null;
  }
}

// Accelerometer
(function() {
  const statusId = 'accelerometer-status', xId = 'acc-x', yId = 'acc-y', zId = 'acc-z';
  let supported = ('Accelerometer' in window);
  if (supported) {
    setStatus(statusId, 'Supported! Waiting for data…');
    try {
      safeSensorStart(window.Accelerometer, s => {
        setStatus(statusId, 'Live');
        setValue(xId, s.x);
        setValue(yId, s.y);
        setValue(zId, s.z);
      }, {frequency: 30},
      e => setStatus(statusId, 'Sensor error: ' + e.error.name, true)
      );
    } catch (e) {
      setStatus(statusId, 'Error starting sensor', true);
    }
  } else {
    setStatus(statusId, 'Not supported in your browser.', true);
  }
})();

// Gyroscope
(function() {
  const statusId = 'gyroscope-status', xId = 'gyro-x', yId = 'gyro-y', zId = 'gyro-z';
  let supported = ('Gyroscope' in window);
  if (supported) {
    setStatus(statusId, 'Supported! Waiting for data…');
    try {
      safeSensorStart(window.Gyroscope, s => {
        setStatus(statusId, 'Live');
        setValue(xId, s.x);
        setValue(yId, s.y);
        setValue(zId, s.z);
      }, {frequency: 30},
      e => setStatus(statusId, 'Sensor error: ' + e.error.name, true)
      );
    } catch (e) {
      setStatus(statusId, 'Error starting sensor', true);
    }
  } else {
    setStatus(statusId, 'Not supported in your browser.', true);
  }
})();

// Magnetometer
(function() {
  const statusId = 'magnetometer-status', xId = 'mag-x', yId = 'mag-y', zId = 'mag-z';
  let supported = ('Magnetometer' in window);
  if (supported) {
    setStatus(statusId, 'Supported! Waiting for data…');
    try {
      safeSensorStart(window.Magnetometer, s => {
        setStatus(statusId, 'Live');
        setValue(xId, s.x);
        setValue(yId, s.y);
        setValue(zId, s.z);
      }, {frequency: 10},
      e => setStatus(statusId, 'Sensor error: ' + e.error.name, true)
      );
    } catch (e) {
      setStatus(statusId, 'Error starting sensor', true);
    }
  } else {
    setStatus(statusId, 'Not supported in your browser.', true);
  }
})();

// Ambient Light Sensor
(function() {
  const statusId = 'ambientlight-status', luxId = 'light-lux';
  let supported = ('AmbientLightSensor' in window);
  if (supported) {
    setStatus(statusId, 'Supported! Waiting for data…');
    try {
      safeSensorStart(window.AmbientLightSensor, s => {
        setStatus(statusId, 'Live');
        setValue(luxId, s.illuminance, 1);
      }, {frequency: 1},
      e => setStatus(statusId, 'Sensor error: ' + e.error.name, true)
      );
    } catch (e) {
      setStatus(statusId, 'Error starting sensor', true);
    }
  } else {
    setStatus(statusId, 'Not supported in your browser.', true);
  }
})();

// Fallback: DeviceMotionEvent
(function() {
  const statusId = 'devicemotion-status';
  const axId = 'dm-ax', ayId = 'dm-ay', azId = 'dm-az';
  const alphaId = 'dm-alpha', betaId = 'dm-beta', gammaId = 'dm-gamma';
  if ('DeviceMotionEvent' in window) {
    setStatus(statusId, 'Supported! Waiting for data…');
    window.addEventListener('devicemotion', function(e) {
      setStatus(statusId, 'Live');
      const a = e.accelerationIncludingGravity || {};
      setValue(axId, a.x);
      setValue(ayId, a.y);
      setValue(azId, a.z);
      const r = e.rotationRate || {};
      setValue(alphaId, r.alpha);
      setValue(betaId, r.beta);
      setValue(gammaId, r.gamma);
    });
  } else {
    setStatus(statusId, 'Not supported in your browser.', true);
  }
})();

// Fallback: DeviceOrientationEvent
(function() {
  const statusId = 'deviceorientation-status';
  const alphaId = 'dorient-alpha', betaId = 'dorient-beta', gammaId = 'dorient-gamma';
  if ('DeviceOrientationEvent' in window) {
    setStatus(statusId, 'Supported! Waiting for data…');
    window.addEventListener('deviceorientation', function(e) {
      setStatus(statusId, 'Live');
      setValue(alphaId, e.alpha);
      setValue(betaId, e.beta);
      setValue(gammaId, e.gamma);
    });
  } else {
    setStatus(statusId, 'Not supported in your browser.', true);
  }
})();

// Optional: Prompt for permissions required for iOS 13+ and some Android browsers
(async function() {
  // See https://w3c.github.io/deviceorientation/#security-and-privacy
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    const blocks = document.querySelectorAll('.sensor-block');
    const permBtn = document.createElement('button');
    permBtn.className = 'perm-btn';
    permBtn.textContent = 'Enable Motion & Orientation Sensors';
    permBtn.onclick = async function() {
      try {
        let p1 = await DeviceMotionEvent.requestPermission();
        let p2 = await DeviceOrientationEvent.requestPermission();
        permBtn.remove();
        // Now sensors will fire events
      } catch (e) {
        alert('Permission denied. Sensor data won\'t be available.');
      }
    };
    document.body.insertBefore(permBtn, document.getElementById('sensors'));
  }
})();

// Offline support via service worker (optional)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').catch(function(){ /* ignore fail */ });
  });
}
