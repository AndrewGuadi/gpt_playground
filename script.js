// script.js
// Sensor Dashboard Logic

function setStatus(id, msg, ok = false) {
  const el = document.getElementById(id);
  el.innerHTML = ok
    ? `<span class='px-2 py-1 rounded bg-emerald-100 text-emerald-700'>${msg}</span>`
    : `<span class='px-2 py-1 rounded bg-red-100 text-red-700'>${msg}</span>`;
}

function round(val) {
  return val ? val.toFixed(2) : '0.00';
}

// 1. Accelerometer (Generic Sensor API)
(function() {
  let outputX = document.getElementById('acc-x');
  let outputY = document.getElementById('acc-y');
  let outputZ = document.getElementById('acc-z');
  let status = 'acc-status';
  if ('Accelerometer' in window) {
    try {
      let sensor = new Accelerometer({ frequency: 30 });
      sensor.addEventListener('reading', () => {
        outputX.textContent = round(sensor.x);
        outputY.textContent = round(sensor.y);
        outputZ.textContent = round(sensor.z);
      });
      sensor.addEventListener('activate', () => setStatus(status, 'Live', true));
      sensor.addEventListener('error', e => setStatus(status, 'Error: ' + e.error.name));
      sensor.start();
    } catch (e) {
      setStatus(status, e.toString());
    }
  } else {
    setStatus(status, 'Not supported');
  }
})();

// 2. Gyroscope (Generic Sensor API)
(function() {
  let outputX = document.getElementById('gyro-x');
  let outputY = document.getElementById('gyro-y');
  let outputZ = document.getElementById('gyro-z');
  let status = 'gyro-status';
  if ('Gyroscope' in window) {
    try {
      let sensor = new Gyroscope({ frequency: 30 });
      sensor.addEventListener('reading', () => {
        outputX.textContent = round(sensor.x);
        outputY.textContent = round(sensor.y);
        outputZ.textContent = round(sensor.z);
      });
      sensor.addEventListener('activate', () => setStatus(status, 'Live', true));
      sensor.addEventListener('error', e => setStatus(status, 'Error: ' + e.error.name));
      sensor.start();
    } catch (e) {
      setStatus(status, e.toString());
    }
  } else {
    setStatus(status, 'Not supported');
  }
})();

// 3. DeviceMotion (Fallback)
(function() {
  let ax = document.getElementById('dm-ax'), ay = document.getElementById('dm-ay'), az = document.getElementById('dm-az');
  let rx = document.getElementById('dm-rx'), ry = document.getElementById('dm-ry'), rz = document.getElementById('dm-rz');
  let status = 'dm-status';
  if ('ondevicemotion' in window) {
    window.addEventListener('devicemotion', function(ev) {
      if (ev.acceleration) {
        ax.textContent = round(ev.acceleration.x);
        ay.textContent = round(ev.acceleration.y);
        az.textContent = round(ev.acceleration.z);
      }
      if (ev.rotationRate) {
        rx.textContent = round(ev.rotationRate.alpha);
        ry.textContent = round(ev.rotationRate.beta);
        rz.textContent = round(ev.rotationRate.gamma);
      }
    });
    setStatus(status, 'Live', true);
  } else {
    setStatus(status, 'Not supported');
  }
})();

// 4. DeviceOrientation (Fallback)
(function() {
  let a = document.getElementById('do-alpha'), b = document.getElementById('do-beta'), g = document.getElementById('do-gamma'), ab = document.getElementById('do-abs');
  let status = 'do-status';
  if ('ondeviceorientation' in window) {
    window.addEventListener('deviceorientation', function(ev) {
      a.textContent = round(ev.alpha);
      b.textContent = round(ev.beta);
      g.textContent = round(ev.gamma);
      ab.textContent = ev.absolute ? 'Yes' : 'No';
    });
    setStatus(status, 'Live', true);
  } else {
    setStatus(status, 'Not supported');
  }
})();


// 6. Magnetometer (Generic Sensor API)
(function() {
  let x = document.getElementById('mag-x'), y = document.getElementById('mag-y'), z = document.getElementById('mag-z'), s = document.getElementById('mag-strength');
  let status = 'mag-status';
  if ('Magnetometer' in window) {
    try {
      let sensor = new Magnetometer({frequency: 30});
      sensor.addEventListener('reading', () => {
        x.textContent = round(sensor.x);
        y.textContent = round(sensor.y);
        z.textContent = round(sensor.z);
        let str = Math.sqrt(sensor.x ** 2 + sensor.y ** 2 + sensor.z ** 2);
        s.textContent = round(str);
      });
      sensor.addEventListener('activate', () => setStatus(status, 'Live', true));
      sensor.addEventListener('error', e => setStatus(status, 'Error: ' + e.error.name));
      sensor.start();
    } catch (e) {
      setStatus(status, e.toString());
    }
  } else {
    setStatus(status, 'Not supported');
  }
})();

// Permissions Tips
if (window.isSecureContext) {
  // Optionally prompt the user for permissions on iOS/Android
} else {
  document.body.insertAdjacentHTML('afterbegin', `<div class='bg-red-100 text-red-800 text-center py-2 shadow-md neumorphism-soft mb-6'>⚠️ Some sensors only work on HTTPS or localhost (secure origin).</div>`);
}

// Service Worker for offline support (optional, can be removed if not needed)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
