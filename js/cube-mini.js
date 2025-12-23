
// cube-mini.js — Mini playable Cube Memory demo for the hero monitor.
// Controls: Enter start/restart, keys 1–6 to repeat the sequence.
// Audio: subtle tones (toggle via demo Mute/Unmute button).

export function mountCubeMini(container){
  ensureStyles();

  const root = document.createElement("div");
  root.className = "cmini";
  root.tabIndex = 0;
  root.setAttribute("role","application");
  root.setAttribute("aria-label","Cube Memory mini demo");

  root.innerHTML = `
    <div class="cminiHud">
      <div class="cminiPill" id="cRound">Round: 0</div>
      <div class="cminiPill" id="cStatus">Press Enter to start</div>
      <div class="cminiPill cminiKeys">Keys: 1–6</div>
    </div>

    <div class="cminiScene" id="cScene">
      <div class="cminiCube" id="cCube">
        <div class="cminiFace f1" data-face="1">1</div>
        <div class="cminiFace f2" data-face="2">2</div>
        <div class="cminiFace f3" data-face="3">3</div>
        <div class="cminiFace f4" data-face="4">4</div>
        <div class="cminiFace f5" data-face="5">5</div>
        <div class="cminiFace f6" data-face="6">6</div>
      </div>
      <div class="cminiHint cminiHintDesktop">Enter = start/restart • Match the sequence</div>
    </div>

    <div class="cminiTouch" id="cTouch">
      <button class="cminiTouchBtn cminiStart" id="cTouchStart" type="button">START</button>
      <div class="cminiTouchGrid">
        <button class="cminiTouchBtn" data-num="1" type="button">1</button>
        <button class="cminiTouchBtn" data-num="2" type="button">2</button>
        <button class="cminiTouchBtn" data-num="3" type="button">3</button>
        <button class="cminiTouchBtn" data-num="4" type="button">4</button>
        <button class="cminiTouchBtn" data-num="5" type="button">5</button>
        <button class="cminiTouchBtn" data-num="6" type="button">6</button>
      </div>
    </div>

    <div class="cminiOverlay" id="cOver" aria-hidden="true">
      <div class="cminiCard">
        <div class="cminiTitle" id="cOverTitle">Game Over</div>
        <div class="cminiSub" id="cOverSub">Best round: <span id="cBest">0</span></div>
        <div class="cminiBtns">
          <button class="cminiBtn" id="cRestart" type="button">Restart</button>
          <button class="cminiBtn ghost" data-demo-close type="button">Close</button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(root);

  const faces = Array.from(root.querySelectorAll(".cminiFace"));
  const cube  = root.querySelector("#cCube");
  const scene = root.querySelector("#cScene");

  // Fit the square cube scene to the available monitor viewport (avoid oversized/cropped demo)
  let _ro = null;
  const MAX_ROUNDS = 5; // Demo caps at 5 rounds

  function fitToMonitor(){
    // container is the monitor viewport; keep a little padding
    const w = Math.max(0, (container.clientWidth || 0) - 16);
    const h = Math.max(0, (container.clientHeight || 0) - 120); // leave space for HUD + touch controls
    const size = Math.max(120, Math.min(200, w, h)); // cap at 200px max for demo
    scene.style.width = size + "px";
    scene.style.height = size + "px";
    root.style.setProperty("--cmini-size", size + "px");
    root.style.setProperty("--cmini-half", (size / 2) + "px"); // for 3D cube translateZ
    root.style.setProperty("--cmini-font", Math.max(18, Math.floor(size * 0.20)) + "px");
  }

  // Initialize sizing
  fitToMonitor();
  _ro = new ResizeObserver(()=>fitToMonitor());
  try{ _ro.observe(container); }catch{}

  const roundEl  = root.querySelector("#cRound");
  const statusEl = root.querySelector("#cStatus");
  const over     = root.querySelector("#cOver");
  const overTitle = root.querySelector("#cOverTitle");
  const overSub  = root.querySelector("#cOverSub");
  const bestEl   = root.querySelector("#cBest");
  const restartBtn = root.querySelector("#cRestart");

  // ----- Audio (WebAudio) -----
  let audioCtx = null;
  let master = null;
  let muted = false;

  function initAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = audioCtx.createDynamicsCompressor();
      comp.threshold.value = -26;
      comp.knee.value = 18;
      comp.ratio.value = 5;
      comp.attack.value = 0.01;
      comp.release.value = 0.12;

      master = audioCtx.createGain();
      master.gain.value = 0.9; // louder than default
      master.connect(comp).connect(audioCtx.destination);
    }
    if(audioCtx.state === "suspended"){
      audioCtx.resume().catch(()=>{});
    }
  }

  function setMuted(v){
    muted = !!v;
    if(master) master.gain.value = muted ? 0 : 0.9;
  }
  function needsGesture(){
    return !audioCtx || audioCtx.state === "suspended";
  }

  function tone(n){
    if(!audioCtx || !master || muted) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 220 + n * 60;

    const t0 = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.26);

    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + 0.30);
  }

  // Expose mute setter to demo.js (which toggles its button)
  container._demoSetMuted = (v)=>setMuted(v);

  // ----- Game logic (from your cube-space4.html) -----
  let sequence = [];
  let userIndex = 0;
  let round = 0;
  let state = "idle"; // idle | watching | input | fail
  const timers = new Set();

  function setFocus(faceNum){
    let fx = 0, fy = 0;
    switch(faceNum){
      case 1: fx = 0; fy = 0; break;
      case 2: fx = 0; fy = -90; break;
      case 3: fx = 0; fy = -180; break;
      case 4: fx = 0; fy = 90; break;
      case 5: fx = -90; fy = 0; break;
      case 6: fx = 90; fy = 0; break;
    }
    cube.style.setProperty("--fx", fx + "deg");
    cube.style.setProperty("--fy", fy + "deg");
  }

  function flash(faceNum, duration=240){
    const face = faces.find(f => Number(f.dataset.face) === faceNum);
    if(!face) return;
    scene.classList.add("playing");
    setFocus(faceNum);
    face.classList.add("active");
    tone(faceNum);
    setTimeout(()=>{
      face.classList.remove("active");
      scene.classList.remove("playing");
    }, duration);
  }

  function updateHUD(){
    roundEl.textContent = `Round: ${round}/${MAX_ROUNDS}`;
  }

  function hideOver(){
    over.classList.remove("show");
    over.setAttribute("aria-hidden","true");
  }

  function showOver(won = false){
    over.classList.add("show");
    over.setAttribute("aria-hidden","false");
    if(won){
      if(overTitle) overTitle.textContent = "Demo Complete!";
      if(overSub) overSub.innerHTML = "You beat all 5 rounds!";
      statusEl.textContent = "You won! Press Enter to replay";
    } else {
      if(overTitle) overTitle.textContent = "Game Over";
      if(overSub) overSub.innerHTML = `Best round: <span id="cBest">${round}</span>`;
      statusEl.textContent = "Game Over — Press Enter";
    }
    state = "fail";
  }

  function playSequence(){
    state = "watching";
    statusEl.textContent = "Watching";
    let i = 0;
    const id = setInterval(()=>{
      flash(sequence[i], 260);
      i++;
      if(i >= sequence.length){
        clearInterval(id);
        timers.delete(id);
        setTimeout(()=>{
          state = "input";
          statusEl.textContent = "Your turn";
        }, 420);
      }
    }, 650);
    timers.add(id);
  }

  function nextRound(){
    // Check for demo win condition
    if(round >= MAX_ROUNDS){
      scene.classList.add("playing");
      faces.forEach(f=>f.classList.add("active"));
      setTimeout(()=>{
        faces.forEach(f=>f.classList.remove("active"));
        scene.classList.remove("playing");
        showOver(true); // Won!
      }, 400);
      return;
    }
    round++;
    updateHUD();
    userIndex = 0;
    sequence.push(1 + Math.floor(Math.random()*6));
    playSequence();
  }

  function reset(){
    initAudio();
    sequence = [];
    userIndex = 0;
    round = 0;
    updateHUD();
    hideOver();
    setFocus(1);
    nextRound();
  }

  function fail(){
    state = "fail";
    scene.classList.add("playing");
    faces.forEach(f=>f.classList.add("active"));
    setTimeout(()=>{
      faces.forEach(f=>f.classList.remove("active"));
      scene.classList.remove("playing");
      showOver();
    }, 320);
  }

  function onKey(e){
    if(!document.body.classList.contains("demo-open")) return;

    if(e.key === "Enter"){
      e.preventDefault();
      if(state === "idle" || state === "fail") reset();
      return;
    }

    const num = parseInt(e.key, 10);
    if(Number.isFinite(num) && num >= 1 && num <= 6){
      e.preventDefault();
      if(needsGesture()) initAudio();
      flash(num, 180);

      if(state !== "input") return;

      if(num === sequence[userIndex]){
        userIndex++;
        if(userIndex >= sequence.length){
          setTimeout(nextRound, 520);
        }
      } else {
        fail();
      }
    }
  }

  // Keep the demo responsive even if focus drifts
  document.addEventListener("keydown", onKey, { passive:false });

  restartBtn?.addEventListener("click", ()=>{
    reset();
    root.focus();
  });

  // Touch controls for mobile
  const touchStart = root.querySelector("#cTouchStart");
  const touchBtns = root.querySelectorAll(".cminiTouchBtn[data-num]");

  touchStart?.addEventListener("click", ()=>{
    if(needsGesture()) initAudio();
    if(state === "idle" || state === "fail") reset();
    root.focus();
  });

  touchBtns.forEach(btn => {
    btn.addEventListener("click", ()=>{
      const num = parseInt(btn.dataset.num, 10);
      if(!Number.isFinite(num) || num < 1 || num > 6) return;
      if(needsGesture()) initAudio();
      flash(num, 180);

      if(state !== "input") return;

      if(num === sequence[userIndex]){
        userIndex++;
        if(userIndex >= sequence.length){
          setTimeout(nextRound, 520);
        }
      } else {
        fail();
      }
    });
  });

  // Update touch start button text based on state
  function updateTouchStart(){
    if(!touchStart) return;
    if(state === "idle") touchStart.textContent = "START";
    else if(state === "fail") touchStart.textContent = "RESTART";
    else touchStart.textContent = "RESTART";
  }

  // Hook into state changes
  const origShowOver = showOver;
  showOver = function(){
    origShowOver();
    updateTouchStart();
  };

  // initial
  updateHUD();
  updateTouchStart();
  statusEl.textContent = "Tap START or press Enter";
  setFocus(1);
  setTimeout(()=> root.focus(), 60);

  function destroy(){
    try{ _ro && _ro.disconnect(); }catch{}
    document.removeEventListener("keydown", onKey);
    for(const id of timers) clearInterval(id);
    timers.clear();
    try{ if(audioCtx && audioCtx.state !== "closed") audioCtx.close().catch(()=>{}); }catch{}
    try{ container._demoSetMuted = null; }catch{}
    root.remove();
  }

  return { destroy, setMuted, needsGesture };
}

let _done = false;
function ensureStyles(){
  if(_done) return;
  _done = true;

  const css = `
  .cmini{ position:absolute; inset:0; display:grid; place-items:center; padding:10px; outline:none; }
  .cminiHud{ position:absolute; top:10px; left:10px; right:10px; display:flex; justify-content:center; gap:8px; flex-wrap:wrap; z-index:3; pointer-events:none; }
  .cminiPill{ padding:6px 10px; border-radius:999px; background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.10); color: rgba(255,255,255,.86); font: 650 11px/1 var(--font-main); letter-spacing:.02em; backdrop-filter: blur(8px); }
  .cminiScene{ width: var(--cmini-size, min(82%, 320px)); height: var(--cmini-size, auto); aspect-ratio:1/1; display:grid; place-items:center; perspective:900px; position:relative; }
  .cminiScene::before{ content:""; position:absolute; inset:-120px; background: radial-gradient(circle, rgba(5,8,16,.88) 0%, rgba(5,8,16,.55) 42%, transparent 72%); z-index:0; }
  .cminiScene::after{ content:""; position:absolute; left:50%; top:58%; width:320px; height:220px; transform: translate(-50%,0); background: radial-gradient(closest-side, rgba(100,170,255,.22), transparent 68%), radial-gradient(closest-side, rgba(120,120,255,.10), transparent 72%); filter: blur(10px); opacity:.85; z-index:0; }
  .cminiCube{ width:100%; height:100%; max-width:320px; max-height:320px; position:relative; transform-style:preserve-3d;
    transform: rotateX(-18deg) rotateY(28deg) rotateX(var(--fx,0deg)) rotateY(var(--fy,0deg)) translateY(var(--floatY, 0px));
    transition: transform 300ms cubic-bezier(.2,.9,.2,1);
    z-index:1;
  }
  @keyframes cminiFloat{ 0%{ --floatY:0px;} 50%{ --floatY:-7px;} 100%{ --floatY:0px;} }
  .cminiScene:not(.playing) .cminiCube{ animation: cminiFloat 3.8s ease-in-out infinite; }

  .cminiFace{ position:absolute; width:100%; height:100%;
    background: radial-gradient(800px 520px at 22% 18%, rgba(255,255,255,.10), transparent 44%),
      radial-gradient(700px 520px at 78% 86%, rgba(0,0,0,.35), transparent 54%),
      linear-gradient(180deg, rgba(31,41,66,1), rgba(20,26,42,1));
    border:1px solid rgba(255,255,255,.10);
    border-radius:16px;
    display:flex; align-items:center; justify-content:center;
    font-size: var(--cmini-font, 44px);
    font-weight: 850;
    color: rgba(231,233,239,1);
    text-shadow: 0 2px 10px rgba(0,0,0,.35);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.05), inset 0 -18px 40px rgba(0,0,0,.30), 0 18px 30px rgba(0,0,0,.45);
    backface-visibility:hidden;
    transition: background 120ms ease, box-shadow 120ms ease, color 120ms ease, border-color 120ms ease;
  }
  .cminiFace.active{
    background: radial-gradient(800px 520px at 22% 18%, rgba(255,255,255,.18), transparent 44%),
      radial-gradient(700px 520px at 78% 86%, rgba(0,0,0,.22), transparent 54%),
      linear-gradient(180deg, rgba(96,165,250,1), rgba(59,130,246,1));
    color:#fff;
    border-color: rgba(255,255,255,.28);
    box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 0 34px rgba(59,130,246,.55), 0 18px 30px rgba(0,0,0,.45);
  }
  .cminiFace.f1{ transform: rotateY(0deg) translateZ(var(--cmini-half, 80px)); }
  .cminiFace.f2{ transform: rotateY(90deg) translateZ(var(--cmini-half, 80px)); }
  .cminiFace.f3{ transform: rotateY(180deg) translateZ(var(--cmini-half, 80px)); }
  .cminiFace.f4{ transform: rotateY(-90deg) translateZ(var(--cmini-half, 80px)); }
  .cminiFace.f5{ transform: rotateX(90deg) translateZ(var(--cmini-half, 80px)); }
  .cminiFace.f6{ transform: rotateX(-90deg) translateZ(var(--cmini-half, 80px)); }

  .cminiHint{ position:absolute; bottom:-2px; left:50%; transform:translate(-50%, 100%); color: rgba(255,255,255,.72); font: 600 11px/1.2 var(--font-main); letter-spacing:.02em; text-align:center; opacity:.85; width:92%; }

  .cminiOverlay{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:14px;
    background: radial-gradient(900px 700px at 50% 35%, rgba(10,14,24,.55), rgba(0,0,0,.70));
    backdrop-filter: blur(8px);
    opacity:0; pointer-events:none; transition: opacity 180ms ease; z-index:4;
  }
  .cminiOverlay.show{ opacity:1; pointer-events:auto; }
  .cminiCard{ width:min(360px, 92%); border-radius:18px; border:1px solid rgba(255,255,255,.12);
    background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04));
    box-shadow: 0 18px 44px rgba(0,0,0,.55); padding:14px 14px 12px; text-align:center;
  }
  .cminiTitle{ font: 850 18px/1.1 var(--font-main); color: rgba(255,255,255,.92); margin-bottom:6px; }
  .cminiSub{ font: 650 12px/1.4 var(--font-main); color: rgba(255,255,255,.78); margin-bottom:12px; }
  .cminiBtns{ display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .cminiBtn{ padding:9px 12px; border-radius:999px; border:1px solid rgba(255,255,255,.14);
    background: linear-gradient(180deg, rgba(96,165,250,1), rgba(59,130,246,1));
    color:#0b1020; font: 850 12px/1 var(--font-main); cursor:pointer;
  }
  .cminiBtn.ghost{ background: rgba(255,255,255,.06); color: rgba(255,255,255,.90); border-color: rgba(255,255,255,.16); font-weight:750; }

  /* Touch controls for mobile */
  .cminiTouch{ position:absolute; bottom:8px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; z-index:3; }
  .cminiTouchGrid{ display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
  .cminiTouchBtn{
    width:44px; height:44px; border-radius:10px; border:1px solid rgba(255,255,255,.18);
    background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
    color: rgba(255,255,255,.9); font: 800 16px/1 var(--font-main); cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition: background 100ms ease, transform 80ms ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .cminiTouchBtn:active{ background: rgba(59,130,246,.6); transform: scale(0.95); }
  .cminiTouchBtn.cminiStart{
    width:auto; padding:10px 20px; border-radius:999px;
    background: linear-gradient(180deg, rgba(96,165,250,1), rgba(59,130,246,1));
    color:#0b1020; font: 850 13px/1 var(--font-main); letter-spacing:.02em;
  }
  .cminiTouchBtn.cminiStart:active{ transform: scale(0.97); }

  /* Hide touch controls on desktop, show on mobile/touch */
  @media (hover: hover) and (pointer: fine) {
    .cminiTouch{ display:none; }
    .cminiHintDesktop{ display:block; }
  }
  @media (hover: none), (pointer: coarse) {
    .cminiTouch{ display:flex; }
    .cminiHintDesktop{ display:none; }
    .cminiKeys{ display:none; }
  }
  `;
  const style = document.createElement("style");
  style.id = "cminiStyles";
  style.textContent = css;
  document.head.appendChild(style);
}
