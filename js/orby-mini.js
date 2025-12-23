// Mini ORBY demo — Numbers reshape the field, movement is the instrument.
// Keys: Arrow keys to move, 1-9 + 0 for gestures. Sound responds to motion.

export function mountOrbyMini(container){
  const c = document.createElement("canvas");
  c.width = 960;
  c.height = 540;
  c.tabIndex = 0;
  c.setAttribute("aria-label","Orby mini demo – use arrow keys and number keys");
  c.style.outline = "none";
  container.appendChild(c);

  const ctx = c.getContext("2d");
  let raf = 0;
  let t0 = performance.now();

  // === STATE ===
  const keys = { ArrowLeft:false, ArrowRight:false, ArrowUp:false, ArrowDown:false };
  let userX = 0, userY = 0, userVX = 0, userVY = 0;
  const ACCEL = 480, DAMP = 6.5;
  const LIM_X = 160, LIM_Y = 100;

  // Current gesture band: "ground" | "motion" | "dissolve" | "anchor" | null
  let gestureBand = null;
  let gestureNum = 0;
  let gestureTime = 0;

  // Field pulse system
  let pulseRadius = 0;
  let pulseAlpha = 0;
  let pulseColor = [59, 130, 246]; // default blue

  // Orb behavior modifiers (from gestures)
  let orbSpeed = 1.0;
  let orbLoose = 0.0; // 0 = tight, 1 = floating
  let fieldDensity = 0.5;

  // === AUDIO ===
  let AC = null;
  let master = null;
  let carrier = null;
  let carrier2 = null; // harmonic layer
  let carrierGain = null;
  let filter = null;
  let lfo = null;
  let isMuted = true;
  let targetPitch = 220;
  let currentPitch = 220;
  let targetFilter = 1200;
  let currentFilter = 1200;
  let targetGain = 0.15;
  let wasMoving = false;

  function ensureAudio(){
    if(AC) return;
    AC = new (window.AudioContext || window.webkitAudioContext)();

    // Master output with compression
    master = AC.createGain();
    master.gain.value = 0;
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    master.connect(comp).connect(AC.destination);

    // Main carrier oscillator
    carrier = AC.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = 220;

    // Second oscillator (fifth harmonic for richness)
    carrier2 = AC.createOscillator();
    carrier2.type = "sine";
    carrier2.frequency.value = 330; // perfect fifth
    const carrier2Gain = AC.createGain();
    carrier2Gain.gain.value = 0.3; // quieter harmonic

    // Filter for timbre control (more resonant)
    filter = AC.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 3; // more resonance for character

    // Carrier gain (for energy/speed response)
    carrierGain = AC.createGain();
    carrierGain.gain.value = 0.15;

    // Gentle LFO for breathing
    lfo = AC.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.3;
    const lfoGain = AC.createGain();
    lfoGain.gain.value = 12;
    lfo.connect(lfoGain).connect(carrier.frequency);

    // Connect audio graph
    carrier.connect(filter);
    carrier2.connect(carrier2Gain).connect(filter);
    filter.connect(carrierGain).connect(master);

    carrier.start();
    carrier2.start();
    lfo.start();
  }

  // Movement onset sound (when you start moving)
  function movementBlip(intensity){
    if(!AC || isMuted) return;
    try{
      const t = AC.currentTime;
      const o = AC.createOscillator();
      const g = AC.createGain();
      o.type = "triangle";
      o.frequency.value = currentPitch * 1.5;
      g.gain.setValueAtTime(0.15 * intensity, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 0.1);
    }catch{}
  }

  // Gesture sound burst
  function gestureSound(band, num){
    if(!AC || isMuted) return;
    try{
      const t = AC.currentTime;
      const o = AC.createOscillator();
      const g = AC.createGain();

      // Different characteristics per band
      if(band === "ground"){
        o.type = "sine";
        o.frequency.value = 80 + num * 20;
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      } else if(band === "motion"){
        o.type = "triangle";
        o.frequency.value = 220 + (num - 3) * 40;
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      } else if(band === "dissolve"){
        o.type = "sine";
        o.frequency.value = 440 + (num - 6) * 60;
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      } else if(band === "anchor"){
        o.type = "sine";
        o.frequency.value = 110;
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      }

      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 1);
    }catch{}
  }

  function needsGesture(){
    if(!AC) return true;
    return AC.state === "suspended";
  }

  function setMuted(m){
    isMuted = !!m;
    try{
      ensureAudio();
      if(AC.state === "suspended") AC.resume();
      master.gain.value = isMuted ? 0 : 0.9;
    }catch{}
  }

  container._demoSetMuted = setMuted;

  // === NUMBER GESTURE HANDLER ===
  function triggerGesture(num){
    gestureNum = num;
    gestureTime = performance.now();

    // Determine band
    if(num >= 1 && num <= 3){
      gestureBand = "ground";
      pulseColor = [99, 102, 241]; // indigo
      orbSpeed = 0.6;
      orbLoose = 0.0;
      fieldDensity = 0.8;
    } else if(num >= 4 && num <= 6){
      gestureBand = "motion";
      pulseColor = [59, 130, 246]; // blue
      orbSpeed = 1.2;
      orbLoose = 0.3;
      fieldDensity = 0.5;
    } else if(num >= 7 && num <= 9){
      gestureBand = "dissolve";
      pulseColor = [139, 92, 246]; // purple
      orbSpeed = 0.9;
      orbLoose = 0.8;
      fieldDensity = 0.25;
    } else if(num === 0){
      gestureBand = "anchor";
      pulseColor = [20, 184, 166]; // teal
      orbSpeed = 0.4;
      orbLoose = 0.0;
      fieldDensity = 0.6;
      // Anchor also recenters
      userVX *= 0.3;
      userVY *= 0.3;
    }

    // Trigger pulse
    pulseRadius = 0;
    pulseAlpha = 0.6;

    // Trigger sound
    gestureSound(gestureBand, num);
  }

  // === INPUT HANDLERS ===
  const onKeyDown = (e)=>{
    if(!document.body.classList.contains("demo-open")) return;

    // Arrow keys
    if(e.key in keys){
      e.preventDefault();
      keys[e.key] = true;
      return;
    }

    // Number keys 0-9
    const num = parseInt(e.key, 10);
    if(Number.isFinite(num) && num >= 0 && num <= 9){
      e.preventDefault();
      if(needsGesture()){ ensureAudio(); if(AC) AC.resume(); }
      triggerGesture(num);
    }
  };

  const onKeyUp = (e)=>{
    if(e.key in keys) keys[e.key] = false;
  };

  window.addEventListener("keydown", onKeyDown, { passive:false });
  window.addEventListener("keyup", onKeyUp, { passive:false });

  // === DRAW LOOP ===
  function draw(now){
    const dt = Math.min(0.05, (now - t0) / 1000);
    t0 = now;
    const time = now / 1000;

    // --- Physics ---
    const ax = (keys.ArrowRight ? 1:0) - (keys.ArrowLeft ? 1:0);
    const ay = (keys.ArrowDown ? 1:0) - (keys.ArrowUp ? 1:0);
    userVX += ax * ACCEL * dt;
    userVY += ay * ACCEL * dt;

    const damp = Math.exp(-DAMP * dt);
    userVX *= damp;
    userVY *= damp;

    userX += userVX * dt;
    userY += userVY * dt;
    userX = Math.max(-LIM_X, Math.min(LIM_X, userX));
    userY = Math.max(-LIM_Y, Math.min(LIM_Y, userY));

    // Speed magnitude
    const speed = Math.sqrt(userVX*userVX + userVY*userVY);
    const normSpeed = Math.min(1, speed / 200); // more sensitive
    const isMoving = speed > 15;

    // Detect movement onset for blip
    if(isMoving && !wasMoving){
      movementBlip(0.8);
    }
    wasMoving = isMoving;

    // --- Movement → Sound mapping ---
    if(AC && !isMuted){
      // X position → pitch (wider range, more musical)
      const pitchRange = userX / LIM_X; // -1 to 1
      targetPitch = 165 + pitchRange * 110; // 55-275 Hz range (A2 to C#4)

      // Y position → filter (up = bright/open, down = warm/muted)
      const filterRange = -userY / LIM_Y; // inverted: up = positive
      targetFilter = 800 + filterRange * 1400; // 400-2200 Hz - much more dramatic

      // Speed → gain/energy (louder when moving!)
      const baseGain = 0.08; // ambient level when still
      const moveGain = 0.25; // loud when moving fast
      targetGain = baseGain + normSpeed * (moveGain - baseGain);

      // Smooth interpolation
      currentPitch += (targetPitch - currentPitch) * 0.12; // faster response
      currentFilter += (targetFilter - currentFilter) * 0.10;

      try{
        carrier.frequency.value = currentPitch;
        carrier2.frequency.value = currentPitch * 1.5; // perfect fifth harmonic
        filter.frequency.value = currentFilter;
        carrierGain.gain.value = targetGain;
      }catch{}
    }

    // --- Clear & Background ---
    ctx.clearRect(0, 0, c.width, c.height);
    const bg = ctx.createLinearGradient(0, 0, 0, c.height);
    bg.addColorStop(0, "#080d18");
    bg.addColorStop(1, "#050a12");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);

    // --- Field particles (density based on gesture) ---
    const particleCount = Math.floor(40 + fieldDensity * 60);
    ctx.globalAlpha = 0.12 + fieldDensity * 0.08;
    for(let i = 0; i < particleCount; i++){
      const px = (i * 193 + time * 8) % c.width;
      const py = (i * 97 + Math.sin(time * 0.3 + i) * 4) % c.height;
      const tw = 0.5 + 0.5 * Math.sin(time * 0.8 + i * 0.5);
      ctx.fillStyle = `rgba(255,255,255,${0.3 * tw})`;
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.globalAlpha = 1;

    // --- Field Pulse (reacts to number gestures) ---
    if(pulseAlpha > 0.01){
      pulseRadius += (400 - pulseRadius) * 0.08;
      pulseAlpha *= 0.94;

      const pcx = c.width / 2;
      const pcy = c.height / 2;

      ctx.save();
      ctx.globalAlpha = pulseAlpha;
      ctx.beginPath();
      ctx.arc(pcx, pcy, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${pulseColor[0]},${pulseColor[1]},${pulseColor[2]},0.6)`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Inner glow
      const pg = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, pulseRadius);
      pg.addColorStop(0, `rgba(${pulseColor[0]},${pulseColor[1]},${pulseColor[2]},0.15)`);
      pg.addColorStop(1, "transparent");
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.restore();
    }

    // --- Orb position (affected by gestures) ---
    const baseX = c.width * 0.5 + Math.sin(time * 0.5 * orbSpeed) * (50 + orbLoose * 30);
    const baseY = c.height * 0.5 + Math.cos(time * 0.6 * orbSpeed) * (30 + orbLoose * 20);
    const cx = baseX + userX;
    const cy = baseY + userY;
    const r = 52 + Math.sin(time * 1.5) * 4 + normSpeed * 8;

    // --- Orb glow ---
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for(let k = 0; k < 3; k++){
      ctx.globalAlpha = 0.10 - k * 0.025;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 20 + k * 16, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pulseColor[0]},${pulseColor[1]},${pulseColor[2]},1)`;
      ctx.fill();
    }
    ctx.restore();

    // --- Orb body ---
    const og = ctx.createRadialGradient(cx - 12, cy - 14, 8, cx, cy, r);
    og.addColorStop(0, "rgba(255,255,255,0.9)");
    og.addColorStop(0.15, "rgba(180,220,255,0.7)");
    og.addColorStop(0.5, `rgba(${pulseColor[0]},${pulseColor[1]},${pulseColor[2]},0.5)`);
    og.addColorStop(1, "rgba(20,184,166,0.2)");
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // --- Orbital ring ---
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ringTilt = Math.sin(time * 0.25) * 0.2 + orbLoose * 0.15;
    ctx.ellipse(cx, cy + 4, r + 22, (r + 8) * 0.5, ringTilt, 0, Math.PI * 2);
    ctx.stroke();

    // --- HUD ---
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "700 16px system-ui, sans-serif";
    ctx.fillText("ORBY · mini", 20, 30);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "600 12px system-ui, sans-serif";
    ctx.fillText("Arrow keys: move  ·  0-9: gestures", 20, 50);

    if(gestureBand){
      ctx.fillStyle = `rgba(${pulseColor[0]},${pulseColor[1]},${pulseColor[2]},0.8)`;
      ctx.fillText(`${gestureBand.toUpperCase()} [${gestureNum}]`, 20, 68);
    }

    // Sound indicator
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(isMuted ? "sound: off" : "sound: on", c.width - 80, 30);

    raf = requestAnimationFrame(draw);
  }

  raf = requestAnimationFrame(draw);
  try{ ensureAudio(); }catch{}
  setTimeout(() => c.focus(), 60);

  function destroy(){
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    cancelAnimationFrame(raf);
    try{ carrier?.stop(); }catch{}
    try{ carrier2?.stop(); }catch{}
    try{ lfo?.stop(); }catch{}
    try{ AC?.close(); }catch{}
    container._demoSetMuted = null;
  }

  return { destroy, setMuted, needsGesture };
}
