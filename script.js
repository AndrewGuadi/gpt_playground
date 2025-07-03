// script.js
// Core: Web Audio, motion events, tutorial, performance, record, share
// Written as ECMAScript module (if needed) but here as single locally importable file

const C = {
  BPM: 120,
  LOOP_LEN: 60, // total 60 seconds
  PHASES: {
    TUTORIAL: 0,
    BUILD: 1,
    JAM: 2,
    RECORD: 3,
    SHARE: 4
  },
  // Neon accent
  ACCENT: '#52f7e6',
  BG: '#130c2a',
  DRUMS1: [1,0,0,0,1,0,1,0, 1,0,0,0,0,0,1,0],
  DRUMS2: [1,0,1,1,0,1,0,0, 1,1,0,1,0,0,1,1],
  SHAKE_MIN: 15
};

// Web Audio Setup
let ctx, master, masterF, clockInt, isStarted=false, phase = C.PHASES.TUTORIAL;
let drumNode1, drumNode2, bassNode, padNode, mixLevels = {dr1:1,dr2:0,bass:0,pad:0};
let filterVal = 0.5, fadeCross=0.5, shakeTimeout=0;
let recorder, recording = false, recBuffers = [], recLen = 0, replaying = false, recTime = 0;

// Quick util
const lerp = (a,b,t) => a+(b-a)*t;
const clamp = (v,min,max) => Math.max(min, Math.min(max,v));

// DOM refs
const prompt = document.getElementById('promptText');
const hintOverlay = document.getElementById('hintOverlay');
const hintText = document.getElementById('hintText');
const hintAnim = document.getElementById('hintAnim');
const skipHintBtn = document.getElementById('skipHintBtn');
const visualizer = document.getElementById('visualizer');
const countdown = document.getElementById('countdown');
const recordPrompt = document.getElementById('recordPrompt');
const shareSection = document.getElementById('shareSection');
const downloadBtn = document.getElementById('downloadBtn');
const replayBtn = document.getElementById('replayBtn');

// ----- MOTION DETECTION & MAPPING ------
let hasGyro=false, gyRange=0, lastShake=0;
let stateVars = {
  inTutorial: true,
  unlocked: {
    crossfade: false,
    filter: false,
    bass: false,
    pad: false,
    fx: false
  }
};
const TUTORIAL_STEPS = [
  {
    key:'crossfade', desc:'Gently tilt <b>forward/back</b> to mix <span style="color:#3ff">drums</span>.',
    motion:'forwardback', anim:'↕️', param:'crossfade', confirm:'Nice! You faded the beat!'
  },
  {
    key:'filter', desc:'Tilt <b>side-to-side</b> to <span style="color:#bcf">sweep filter</span>.',
    motion:'leftright', anim:'↔️', param:'filter', confirm:'Cool filter sweep!'
  },
  {
    key:'bass',
    desc:'Twist <b>clockwise</b> to bring in <span style="color:#fb4">bass</span>.',
    motion:'cw', anim:'↻', param:'bass', confirm:'The bass is groovin!'
  },
  {
    key:'pad',
    desc:'Twist <b>counter-clockwise</b> for <span style="color:#f8f">pads</span>.',
    motion:'ccw', anim:'↺', param:'pad', confirm:'Lush synth pad!'
  },
  {
    key:'fx',
    desc:'Quickly <b>shake</b> for a wild <span style="color:#ff4">FX</span> fill!',
    motion:'shake', anim:'💥', param:'fx', confirm:'FX Burst! Epic!'
  }
];
let tutorStep = 0, tutorActive = false, tutorTimeout = 0;

function promptHint(step) {
  hintOverlay.classList.remove('hidden');
  hintText.innerHTML = TUTORIAL_STEPS[step].desc;
  hintAnim.innerText = TUTORIAL_STEPS[step].anim;
}

function confirmHint(step) {
  hintAnim.innerHTML = '<span style="font-size:2.2em;">✅</span>';
  hintText.innerHTML = '<b>' + TUTORIAL_STEPS[step].confirm + '</b>';
  tutorTimeout = setTimeout(() => {
    hintOverlay.classList.add('hidden');
    tutorStep++;
    nextTutorial();
  }, 1100);
}

function nextTutorial() {
  if (tutorStep >= TUTORIAL_STEPS.length) {
    hintOverlay.classList.add('hidden');
    phase = C.PHASES.BUILD;
    stateVars.inTutorial = false;
    prompt.innerText = 'Loop starts—try unlocking new layers by tilting, twisting, shaking…';
    showBuildPrompts();
    return;
  }
  promptHint(tutorStep);
}

skipHintBtn.onclick = () => {
  clearTimeout(tutorTimeout);
  hintOverlay.classList.add('hidden');
  phase = C.PHASES.BUILD;
  stateVars.inTutorial = false;
  showBuildPrompts();
};

function showPrompt(msg) {
  prompt.innerHTML = msg;
}
function showBuildPrompts() {
  // Sequence build prompts as layers are unlocked
  prompt.innerHTML = 'Bare kick playing… Tilt, twist or shake to unlock more!';
}

// ------ AUDIO NODE BUILDERS -----
function createNoiseBuffer(dur, rate=44100) {
  const b = ctx.createBuffer(1, dur*rate, rate);
  const d = b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
  return b;
}
function makeDrumNode(pattern,isBright=0) {
  // Simple websampler
  let out = ctx.createGain(), loopStep=0;
  let tickHz = C.BPM*4/60, tSecs = 1/tickHz;
  let kickBuf = ctx.createBuffer(1, 22050, 44100), snBuf = ctx.createBuffer(1, 4410, 44100);
  let k = kickBuf.getChannelData(0); let s = snBuf.getChannelData(0);
  for(let i=0;i<k.length;++i) k[i] = Math.sin(2*Math.PI*i/55)*Math.exp(-i/1500);
  for(let i=0;i<s.length;++i) s[i] = (Math.random()-0.5)*Math.exp(-i/700);
  function playBuf(buf, gain, pan=0) {
    let n = ctx.createBufferSource(); n.buffer = buf;
    let g = ctx.createGain(); g.gain.value = gain;
    let p = ctx.createStereoPanner(); p.pan.value = pan;
    n.connect(g).connect(p).connect(out);
    n.start();
  }
  out.gain.value = 1;
  out.tick = function() {
    if(pattern[loopStep%pattern.length]) playBuf(kickBuf,0.43,0);
    if(loopStep%4==2) playBuf(snBuf,isBright?0.34:0.18,isBright?0.3:-0.3);
    if(isBright && loopStep%8===1) playBuf(snBuf,0.16,0.7);
    loopStep=(loopStep+1)%pattern.length;
  };
  return out;
}
function makeToneNode(freqArr,type='sine',adsr=[0.16,0.18,0.13],color=1) {
  // Returns a gain node - burst of notes
  let out = ctx.createGain(), step=0;
  out.gain.value = 0.5;
  out.tick = function(lvl=1) {
    let ff = freqArr[step%freqArr.length]*color;
    let o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = ff;
    let g = ctx.createGain(); g.gain.value = 0;
    o.connect(g).connect(out);
    let now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.19*lvl, now+adsr[0]);
    g.gain.linearRampToValueAtTime(0.08*lvl, now+adsr[0]+adsr[1]);
    g.gain.linearRampToValueAtTime(0, now+adsr[0]+adsr[1]+adsr[2]);
    o.start(now); o.stop(now+adsr[0]+adsr[1]+adsr[2]+.01);
    o.onended=()=>{o.disconnect();g.disconnect();};
    step=(step+1)%freqArr.length;
  };
  return out;
}
function makePadNode() {
  let out = ctx.createGain();
  let o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
  let g1 = ctx.createGain(), g2 = ctx.createGain();
  o1.type='triangle'; o2.type='triangle';
  o1.frequency.value = 261.6; o2.frequency.value = 329.6; // Cmaj pad approx
  g1.gain.value = 0.16; g2.gain.value=0.13;
  o1.connect(g1).connect(out); o2.connect(g2).connect(out);
  o1.start(); o2.start();
  out.gain.value = 0.0;
  return out;
}
function makeFXBurst() {
  // FX burst: filtered noise hit
  let noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(0.35);
  let g = ctx.createGain();
  noise.connect(g).connect(master);
  let f = ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value = 650+Math.random()*850;
  g.connect(f).connect(masterF);
  g.gain.value=0.21;
  let now = ctx.currentTime;
  g.gain.setValueAtTime(0.21,now);
  g.gain.linearRampToValueAtTime(0,now+0.22);
  noise.start(now); noise.stop(now+0.33);
}

// ----- AUDIO PATCHING --------
function audioInit() {
  if(ctx)return;
  ctx = new(window.AudioContext||window.webkitAudioContext)();
  master = ctx.createGain();
  masterF = ctx.createBiquadFilter();
  masterF.type = 'lowpass';
  masterF.frequency.value = 2700;
  masterF.Q.value = 0.95;
  master.connect(masterF).connect(ctx.destination);

  drumNode1 = makeDrumNode(C.DRUMS1, false);
  drumNode2 = makeDrumNode(C.DRUMS2, true);
  bassNode  = makeToneNode([65,65,65,130,98,98,73,73],'square',[0.07,0.15,0.12],0.7);
  padNode   = makePadNode();
  drumNode1.connect(master);
  drumNode2.connect(master);
  bassNode.connect(master);
  padNode.connect(master);
}
function updateMix() {
  // Fade between drum 1 & 2
  drumNode1.gain.value = 1-fadeCross;
  drumNode2.gain.value = fadeCross;
  masterF.frequency.value = lerp(900,4200,filterVal);
  bassNode.gain.value = mixLevels.bass;
  padNode.gain.value = mixLevels.pad;
}

// ------- MAIN LOOP --------
let loopStep = 0, beatTick=0;
function clockLoop() {
  if(!ctx)return;
  beatTick = (beatTick+1)%16;
  drumNode1.tick();
  drumNode2.tick();
  bassNode.tick(mixLevels.bass);
  // Pad is sustained
  // FX triggered in motion handler
  if(recording) recordStep();
}

// Schedule loop
function startClock() {
  if(clockInt)clearInterval(clockInt);
  loopStep=0; beatTick=0;
  clockInt = setInterval(clockLoop, (60/(C.BPM*4))*1000);
}

// ----------- MOTION CONTROLS ---------------
let lastMotion = {aX:0,aY:0,aZ:0,gamma:0,beta:0,alpha:0}, lastTwist = 0, twistAccum=0;
function handleMotion(e) {
  // Accelerometer: mix/fx
  let acc = e.accelerationIncludingGravity || e;
  let aX = acc.x, aY = acc.y, aZ = acc.z, now = Date.now();
  // Forward/back (crossfade drums)
  let fback = clamp(((aY||0)+7)/14, 0, 1); // phones are vertical upright
  // Left/right (filter sweep)
  let lr = clamp(((aX||0)+7)/14, 0, 1);

  // Shake detection
  let shakeVal = Math.abs(aX-lastMotion.aX)+Math.abs(aY-lastMotion.aY)+Math.abs(aZ-lastMotion.aZ);
  if(shakeVal>C.SHAKE_MIN && now-lastShake>800) {
    lastShake=now; fxBurst();
    triggerTutorial('fx');
  }

  fadeCross = fback;
  filterVal = lr;

  // Gyro: twist (layer/bring in)
  if(hasGyro) {
    let dG = (e.rotationRate?e.rotationRate.alpha||0:0);
    let dt = (dG-lastTwist);
    lastTwist = dG;
    // Integrate over few tics
    twistAccum = twistAccum*0.96 + dt*0.04;
    // cw (bass in), ccw (pad in)
    if(twistAccum>3.5) {
      mixLevels.bass = clamp(mixLevels.bass+0.01,0,1); triggerTutorial('bass');
    }
    else if(twistAccum<-3.5) {
      mixLevels.pad = clamp(mixLevels.pad+0.01,0,1); triggerTutorial('pad');
    }
  }
  else { // fallback: orientation
    if(e.gamma<0) mixLevels.bass = clamp(mixLevels.bass+0.005, 0, 1); // tilt left
    if(e.gamma>0) mixLevels.pad = clamp(mixLevels.pad+0.005, 0, 1); // tilt right
  }
  // crossfade drums
  fadeCross = fback;
  // filter
  filterVal = lr;
  lastMotion = {aX, aY, aZ};
  updateMix();
  triggerTutorial('crossfade'); triggerTutorial('filter');
}
function fxBurst() {
  makeFXBurst();
}

function triggerTutorial(param) {
  // If in tutorial, check match param, unlock/succeed step
  if(phase===C.PHASES.TUTORIAL && tutorStep<TUTORIAL_STEPS.length) {
    if(TUTORIAL_STEPS[tutorStep].param===param) {
      confirmHint(tutorStep);
    }
  }
}

function handleDeviceOrientation(e) {
  // Fallback: use gamma/beta for twist/tilt
  // gamma: left/right, beta: forward/back
  let fback = clamp(((e.beta||0)+20)/70,0,1);
  let lr = clamp(((e.gamma||0)+20)/70,0,1);
  fadeCross=fback; filterVal=lr;
  if(e.alpha<-20) mixLevels.bass = clamp(mixLevels.bass+0.007,0,1);
  if(e.alpha>20) mixLevels.pad = clamp(mixLevels.pad+0.007,0,1);
  updateMix();
  triggerTutorial('crossfade'); triggerTutorial('filter');
}

// ---- VISUALIZER ---
const ctxV = visualizer.getContext('2d');
function renderVis() {
  ctxV.clearRect(0,0,visualizer.width,visualizer.height);
  
  // Neon rings, brightness = volume/energy
  let bassY = 160+ Math.cos(Date.now()/380)*12;
  let padY  = 200+ Math.sin(Date.now()/550)*15;
  // Back pulses
  let t = Date.now()/880;
  for(let i=7;i>0;i--) {
    let brt = lerp(0.016,0.065,mixLevels.bass);
    ctxV.beginPath();
    ctxV.arc(160,160, 36+i*17+Math.sin(t+i)*2, 0, Math.PI*2);
    ctxV.strokeStyle = `rgba(82,247,230,${brt*i})`;
    ctxV.lineWidth = 18-i*1.6;
    ctxV.shadowColor=C.ACCENT;
    ctxV.shadowBlur = Math.floor(9-i);
    ctxV.stroke();
  }

  // Drums
  for(let i=0;i<16;i++) {
    let on = i<(fadeCross*16);
    ctxV.beginPath();
    ctxV.arc(160,160, 69+on*7, i/8*Math.PI, (i+1)/8*Math.PI);
    ctxV.strokeStyle = on?`#fff`: '#444';
    ctxV.lineWidth = 6+on*5;
    ctxV.globalAlpha = 0.42+on*0.13;
    ctxV.shadowColor = C.ACCENT;
    ctxV.shadowBlur = on?5:1;
    ctxV.stroke();
  }
  ctxV.globalAlpha=1;
  ctxV.shadowBlur=0;
  // Filter arc
  ctxV.beginPath();
  ctxV.arc(160,160, 108, Math.PI*1.12, Math.PI*1.12+filterVal*Math.PI*1.24 );
  ctxV.strokeStyle = '#51f8f1';
  ctxV.lineWidth = 7;
  ctxV.stroke();
  // Bass fill
  ctxV.beginPath();
  ctxV.arc(160,160, 117, Math.PI*1.6, Math.PI*1.6+mixLevels.bass*Math.PI*0.55, false);
  ctxV.strokeStyle = '#f8c12d';
  ctxV.lineWidth = 8; ctxV.shadowColor='#f8c12d';
  ctxV.shadowBlur = 10*mixLevels.bass;
  ctxV.stroke();
  // Pad fill
  ctxV.beginPath();
  ctxV.arc(160,160, 125, Math.PI*0.8, Math.PI*0.8+mixLevels.pad*Math.PI*0.59, false);
  ctxV.strokeStyle = '#e76cff';
  ctxV.lineWidth = 8; ctxV.shadowColor='#e76cff';
  ctxV.shadowBlur = 10*mixLevels.pad;
  ctxV.stroke();
  ctxV.shadowBlur=0;

  // FX burst icon
  if(Date.now()-lastShake<700) {
    ctxV.beginPath(); ctxV.arc(160,160,48+Math.random()*25,0,Math.PI*2);
    ctxV.strokeStyle='#ffec4d'; ctxV.lineWidth=3+Math.random()*8;
    ctxV.globalAlpha = 0.83-Math.random()*0.23;
    ctxV.shadowColor='#ffec4d'; ctxV.shadowBlur=23;
    ctxV.stroke();
    ctxV.globalAlpha=1; ctxV.shadowBlur=0;
  }

  requestAnimationFrame(renderVis);
}

// ---------- RECORDING/REPLAY -----------
function startRecording() {
  recorder = ctx.createScriptProcessor(4096,2,2);
  let channelL =[], channelR =[]; recLen=0; recTime=0;
  let recStart = ctx.currentTime;
  masterF.connect(recorder);
  recorder.onaudioprocess = function(ev) {
    channelL.push(ev.inputBuffer.getChannelData(0).slice());
    channelR.push(ev.inputBuffer.getChannelData(1).slice());
    recLen+=ev.inputBuffer.length;
    recTime = ctx.currentTime-recStart;
    if(recTime>=30) stopRecording(channelL,channelR);
  };
  recorder.connect(ctx.destination); // allow monitor
  recording=true;
  prompt.innerText='Recording your set...';
  recordPrompt.classList.remove('hidden');
  let s = 30;
  countdown.innerText = `${s}s`;
  countdown.classList.remove('hidden');
  let cto = setInterval(()=>{
    s--; countdown.innerText=`${s}s`;
    if(s<=0) clearInterval(cto);
  },1000);
  setTimeout(()=>{
    if(recording) stopRecording(channelL,channelR);
  },31000);
}
function stopRecording(channelL,channelR) {
  if(!recording)return;
  recorder.disconnect();
  recording=false;
  recordPrompt.classList.add('hidden');
  countdown.classList.add('hidden');
  prompt.innerText='Mix recorded! Listen or download below.';
  shareSection.classList.remove('hidden');
  buildWav(channelL,channelR,recLen, (wavBlob)=>{
    downloadBtn.onclick = ()=>{
      let url = URL.createObjectURL(wavBlob);
      let a=document.createElement('a'); a.href=url; a.download='motionbeat-set.wav';
      a.click();
      prompt.innerText='Enjoy your groove! Try again for a different mix.';
    };
    replayBtn.onclick = ()=>{
      if(replaying)return;
      replaying=true;
      let audio = new Audio(URL.createObjectURL(wavBlob));
      audio.onended=()=>{replaying=false;};
      audio.play();
      prompt.innerText='Replaying your set...';
    };
  });
}
function buildWav(chL, chR, len, cb) {
  // Lightweight PCM -> wav b64
  let b = new Float32Array(len*2);
  let o=0;
  for(let i=0;i<chL.length;++i) {
    let L=chL[i], R=chR[i];
    for(let j=0;j<L.length;++j) {
      b[o++]=L[j]; b[o++]=R?R[j]:0;
    }
  }
  // Convert
  let wav = encodeWav(b, 44100,2);
  cb(new Blob([wav],{type:'audio/wav'}));
}
function encodeWav(buf, rate, ch) {
  // 16bit PCM
  function u32(v){return [(v)&255,(v>>8)&255,(v>>16)&255,(v>>24)&255]}
  function u16(v){return [(v)&255,(v>>8)&255]}
  let d = [], sz = buf.length*2 + 44;
  d = d.concat([82,73,70,70]);
  d = d.concat(u32(sz-8));
  d = d.concat([87,65,86,69,102,109,116,32]);
  d = d.concat(u32(16));
  d = d.concat(u16(1), u16(ch), u32(rate), u32(rate*2*ch), u16(ch*2), u16(16), [100,97,116,97], u32(buf.length*2));
  for(let i=0;i<buf.length;i++) {
    let v=clamp(Math.floor(buf[i]*32767),-32768,32767);
    d = d.concat(u16(v));
  }
  return new Uint8Array(d);
}

// ---------- USER CONSENT + INIT --------------
function reqPerm() {
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
    DeviceMotionEvent.requestPermission().then(res => {
      if(res==='granted') {
        hookSensors();
      } else {
        prompt.innerHTML='Sensors denied. This demo works best on recent mobile Safari/Chrome.';
      }
    });
  } else {
    // Desktop/older mobile
    hookSensors();
  }
}
function hookSensors() {
  window.addEventListener('devicemotion', handleMotion, true);
  window.addEventListener('deviceorientation', handleDeviceOrientation,false);
  hasGyro = 'DeviceOrientationEvent' in window;
  userStart();
}

function userStart() {
  audioInit();
  updateMix();
  startClock();
  renderVis();
  // Start tutorial
  tutorStep = 0; phase = C.PHASES.TUTORIAL;
  nextTutorial();
}

// ------- PERFORMANCE PHASE logic --------
function goPerformancePhase() {
  phase = C.PHASES.JAM;
  prompt.innerText='Jam: Tilt/twist/shake to play!';
  setTimeout(()=>{
    prompt.innerText='Ready? Jam for 30s!';
    countdown.classList.remove('hidden');
    recordPrompt.classList.remove('hidden');
    startRecording();
  }, 2200);
}

// Unlocked all? Proceed to jam/record
setInterval(()=>{
  if(phase===C.PHASES.BUILD) {
    if(mixLevels.bass>0.6 && mixLevels.pad>0.6 && fadeCross>0.8 && filterVal>0.7 && Date.now()-lastShake<5000) {
      goPerformancePhase();
      phase = C.PHASES.RECORD;
    }
  }
},1200);

// User interaction (audio start)
visualizer.addEventListener('pointerdown',()=>{reqPerm();});
document.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter') reqPerm();});
prompt.innerHTML = 'Tap/click visualizer to start!';

// ------------- End of main js ---------------
