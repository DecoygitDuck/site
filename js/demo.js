import { mountOrbyMini } from "./orby-mini.js";
import { mountCubeMini } from "./cube-mini.js";
import { mountNcosMini } from "./ncos-mini.js";
import { stopHeroAnimation, initHeroAnimation } from "./hero-animation.js";

let cleanup = null;
let isOpen = false;
let muted = false;
let currentMode = null; // "fullscreen" or "hero"

function qs(sel){ return document.querySelector(sel); }

// ===== Hero mode (boring mode, inside computer) =====
function getWrap(){
  return qs("#boringSite .bHeroIllustration .bDemoWrap");
}
function getViewport(){ return document.getElementById("bDemoViewport"); }
function getTitle(){ return document.getElementById("bDemoTitle"); }
function getMuteBtn(){ return document.getElementById("bDemoMute"); }

function setHint(show, msg){
  const wrap = getWrap();
  if(!wrap) return;
  const h = document.getElementById("bDemoHint");
  if(h && typeof msg === "string" && msg.trim()) h.textContent = msg;
  wrap.classList.toggle("show-hint", !!show);
}

// ===== Fullscreen mode (works in any mode) =====
let fullscreenOverlay = null;

function ensureFullscreenOverlay(){
  if(fullscreenOverlay) return fullscreenOverlay;

  const overlay = document.createElement("div");
  overlay.id = "demoFullscreen";
  overlay.className = "demoFs";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="demoFsBackdrop" data-demo-close></div>
    <div class="demoFsContainer" role="dialog" aria-label="App demo">
      <div class="demoFsTop">
        <div class="demoFsTitle" id="demoFsTitle">Demo</div>
        <div class="demoFsBtns">
          <button class="demoFsBtn" type="button" id="demoFsMute" aria-label="Mute/unmute">Mute</button>
          <button class="demoFsBtn demoFsClose" type="button" data-demo-close aria-label="Close demo">
            <span>Close</span>
            <span class="demoFsEsc">ESC</span>
          </button>
        </div>
      </div>
      <div class="demoFsViewport" id="demoFsViewport"></div>
      <div class="demoFsHint" id="demoFsHint">Tap START or press Enter to begin</div>
    </div>
  `;
  document.body.appendChild(overlay);
  fullscreenOverlay = overlay;

  // Add styles
  ensureFullscreenStyles();

  return overlay;
}

function ensureFullscreenStyles(){
  if(document.getElementById("demoFsStyles")) return;

  const css = `
  .demoFs{
    position:fixed; inset:0; z-index:9999;
    display:flex; align-items:center; justify-content:center;
    opacity:0; pointer-events:none;
    transition: opacity 200ms ease;
  }
  .demoFs.is-open{
    opacity:1; pointer-events:auto;
  }
  .demoFsBackdrop{
    position:absolute; inset:0;
    background: rgba(2,6,23,.92);
    backdrop-filter: blur(12px);
  }
  .demoFsContainer{
    position:relative; z-index:1;
    width: min(640px, 94vw);
    height: min(520px, 80vh);
    background: linear-gradient(180deg, rgba(15,23,42,1), rgba(10,15,30,1));
    border: 1px solid rgba(255,255,255,.08);
    border-radius: 20px;
    box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.03) inset;
    display:flex; flex-direction:column;
    overflow:hidden;
    transform: scale(0.96);
    transition: transform 200ms ease;
  }
  .demoFs.is-open .demoFsContainer{
    transform: scale(1);
  }
  .demoFsTop{
    display:flex; align-items:center; justify-content:space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    background: rgba(255,255,255,.02);
  }
  .demoFsTitle{
    font: 800 14px/1 var(--font-main, system-ui, sans-serif);
    color: rgba(255,255,255,.9);
    letter-spacing: .02em;
  }
  .demoFsBtns{
    display:flex; gap:8px;
  }
  .demoFsBtn{
    padding: 8px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.85);
    font: 700 12px/1 var(--font-main, system-ui, sans-serif);
    cursor:pointer;
    transition: background 120ms ease;
    display:flex; align-items:center; gap:6px;
  }
  .demoFsBtn:hover{ background: rgba(255,255,255,.10); }
  .demoFsClose{
    background: linear-gradient(180deg, rgba(239,68,68,.9), rgba(220,38,38,.9));
    border-color: rgba(255,255,255,.15);
    color: #fff;
  }
  .demoFsClose:hover{ background: linear-gradient(180deg, rgba(248,113,113,1), rgba(239,68,68,1)); }
  .demoFsEsc{
    padding: 2px 5px;
    border-radius: 4px;
    background: rgba(0,0,0,.25);
    font-size: 10px;
    font-weight: 600;
    opacity: .8;
  }
  @media (hover: none), (pointer: coarse) {
    .demoFsEsc{ display:none; }
  }
  .demoFsViewport{
    position:relative;
    flex:1;
    overflow:hidden;
  }
  .demoFsHint{
    padding: 10px 16px;
    text-align:center;
    font: 600 12px/1.3 var(--font-main, system-ui, sans-serif);
    color: rgba(255,255,255,.6);
    border-top: 1px solid rgba(255,255,255,.04);
    background: rgba(0,0,0,.15);
    opacity:0;
    transform: translateY(4px);
    transition: opacity 150ms ease, transform 150ms ease;
  }
  .demoFs.show-hint .demoFsHint{
    opacity:1;
    transform: translateY(0);
  }
  `;
  const style = document.createElement("style");
  style.id = "demoFsStyles";
  style.textContent = css;
  document.head.appendChild(style);
}

function openFullscreenDemo(appKey){
  const overlay = ensureFullscreenOverlay();
  const vp = document.getElementById("demoFsViewport");
  const titleEl = document.getElementById("demoFsTitle");
  const hintEl = document.getElementById("demoFsHint");
  const muteBtn = document.getElementById("demoFsMute");

  if(!vp) return false;

  // Clear previous
  if(cleanup){ try{ cleanup(); }catch{} cleanup = null; }
  vp.innerHTML = "";

  // Title
  const title = (appKey || "demo").toUpperCase();
  if(titleEl) titleEl.textContent = `DEMO: ${title}`;

  // Mount demo
  if(appKey === "orby"){
    const { destroy, setMuted: sm, needsGesture } = mountOrbyMini(vp);
    cleanup = destroy;
    muted = false;
    sm(muted);
    if(muteBtn) muteBtn.textContent = muted ? "Unmute" : "Mute";
    if(hintEl) hintEl.textContent = "Arrow keys: move · Number keys 0-9: gestures · Movement shapes the sound";
    overlay.classList.add("show-hint");
  } else if(appKey === "cube"){
    const { destroy, setMuted: sm, needsGesture } = mountCubeMini(vp);
    cleanup = destroy;
    muted = false;
    sm(muted);
    if(muteBtn) muteBtn.textContent = muted ? "Unmute" : "Mute";
    if(hintEl) hintEl.textContent = "Tap START or press Enter. Match the sequence using keys 1–6.";
    overlay.classList.add("show-hint");
  } else if(appKey === "ncos" || appKey === "notecenter"){
    const { destroy, setMuted: sm, needsGesture } = mountNcosMini(vp);
    cleanup = destroy;
    muted = false;
    sm(muted);
    if(muteBtn) muteBtn.textContent = muted ? "Unmute" : "Mute";
    if(hintEl) hintEl.textContent = "Click notes to edit · + to create · Filter by category · Pin favorites";
    overlay.classList.add("show-hint");
  } else {
    const d = document.createElement("div");
    d.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.82);font:600 14px/1.2 var(--font-main);letter-spacing:.02em;";
    d.textContent = "Demo coming soon.";
    vp.appendChild(d);
    overlay.classList.remove("show-hint");
  }

  // Store mute setter for later use
  const originalSetMuted = vp._demoSetMuted;
  vp._demoSetMuted = originalSetMuted;

  // Show
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("demo-open");
  isOpen = true;
  currentMode = "fullscreen";

  // Focus the demo
  setTimeout(()=>{
    const focusable = vp.querySelector("[tabindex]") || vp.querySelector("canvas");
    if(focusable && focusable.focus) focusable.focus();
  }, 80);

  return true;
}

function closeFullscreenDemo(){
  if(!fullscreenOverlay) return;

  fullscreenOverlay.classList.remove("is-open");
  fullscreenOverlay.classList.remove("show-hint");
  fullscreenOverlay.setAttribute("aria-hidden", "true");

  if(cleanup){ try{ cleanup(); }catch{} cleanup = null; }

  const vp = document.getElementById("demoFsViewport");
  if(vp) vp.innerHTML = "";

  document.body.classList.remove("demo-open");
  isOpen = false;
  currentMode = null;
}

// ===== Hero mode functions (for boring mode) =====
function openHeroDemo(appKey){
  const wrap = getWrap();
  const vp = getViewport();
  if(!wrap || !vp) return false;

  // Stop hero typing while demo is open
  stopHeroAnimation();

  // Clear previous
  if(cleanup){ try{ cleanup(); }catch{} cleanup = null; }
  vp.innerHTML = "";

  // Title
  const title = (appKey || "demo").toUpperCase();
  const tEl = getTitle();
  if(tEl) tEl.textContent = `DEMO: ${title}`;

  // Mount demo
  if(appKey === "orby"){
    const { destroy, setMuted: sm, needsGesture } = mountOrbyMini(vp);
    cleanup = destroy;
    muted = false;
    sm(muted);
    const mb = getMuteBtn();
    if(mb) mb.textContent = muted ? "Unmute" : "Mute";
    setHint(true, needsGesture() ? "Click Unmute if you don't hear audio. Use arrow keys to move the orb." : "Use arrow keys to move the orb.");
  } else if(appKey === "cube"){
    const { destroy, setMuted: sm, needsGesture } = mountCubeMini(vp);
    cleanup = destroy;
    muted = false;
    sm(muted);
    const mb = getMuteBtn();
    if(mb) mb.textContent = muted ? "Unmute" : "Mute";
    setHint(true, "Tap START or press Enter. Match the sequence using keys 1–6.");
  } else if(appKey === "ncos" || appKey === "notecenter"){
    const { destroy, setMuted: sm, needsGesture } = mountNcosMini(vp);
    cleanup = destroy;
    muted = false;
    sm(muted);
    const mb = getMuteBtn();
    if(mb) mb.textContent = muted ? "Unmute" : "Mute";
    setHint(true, "Click notes to edit · + to create · Filter by category");
  } else {
    const d = document.createElement("div");
    d.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.82);font:600 12px/1.2 var(--font-main);letter-spacing:.02em;";
    d.textContent = "Demo coming soon.";
    vp.appendChild(d);
    setHint(false);
  }

  // Wire close buttons
  bindOnce();

  // Show
  wrap.classList.add("is-open");
  isOpen = true;
  currentMode = "hero";

  // Focus
  try{
    document.body.classList.add("demo-open");
    const ill = qs("#boringSite .bHeroIllustration");
    ill?.classList.add("demo-focus");
    ill?.scrollIntoView({ behavior: "smooth", block: "center" });
  }catch{}

  setTimeout(()=>{
    const focusable = vp.querySelector("[tabindex]") || vp.querySelector("canvas");
    if(focusable && focusable.focus) focusable.focus();
  }, 80);

  return true;
}

function closeHeroDemo(){
  const wrap = getWrap();
  const vp = getViewport();
  if(!wrap || !vp) return;

  wrap.classList.remove("is-open");
  wrap.classList.remove("show-hint");
  isOpen = false;
  currentMode = null;

  try{
    document.body.classList.remove("demo-open");
    const ill = qs("#boringSite .bHeroIllustration");
    ill?.classList.remove("demo-focus");
  }catch{}

  if(cleanup){ try{ cleanup(); }catch{} cleanup = null; }
  vp.innerHTML = "";

  // Resume hero typing
  initHeroAnimation();
}

// ===== Public API =====
export function openDemo(appKey){
  // Close any existing demo first
  if(isOpen) closeDemo();

  // Determine which mode to use based on context
  const isBoring = document.body.classList.contains("mode-boring");

  if(isBoring){
    // In boring mode, use the hero computer for small demos
    // Use fullscreen for a larger experience
    return openFullscreenDemo(appKey);
  } else {
    // In terminal mode, always use fullscreen
    return openFullscreenDemo(appKey);
  }
}

export function closeDemo(){
  if(currentMode === "fullscreen"){
    closeFullscreenDemo();
  } else if(currentMode === "hero"){
    closeHeroDemo();
  }
}

function toggleMute(){
  muted = !muted;

  // Update button text
  const fsBtn = document.getElementById("demoFsMute");
  const heroBtn = getMuteBtn();
  if(fsBtn) fsBtn.textContent = muted ? "Unmute" : "Mute";
  if(heroBtn) heroBtn.textContent = muted ? "Unmute" : "Mute";

  // Apply to current demo
  const fsVp = document.getElementById("demoFsViewport");
  const heroVp = getViewport();
  const vp = currentMode === "fullscreen" ? fsVp : heroVp;

  if(vp){
    const setter = vp._demoSetMuted;
    if(typeof setter === "function") setter(muted);
  }

  // Hide hint after first interaction
  if(fullscreenOverlay) fullscreenOverlay.classList.remove("show-hint");
  const heroWrap = getWrap();
  if(heroWrap) heroWrap.classList.remove("show-hint");
}

let bound = false;
function bindOnce(){
  if(bound) return;
  bound = true;

  // Close buttons (for both modes)
  document.addEventListener("click", (e)=>{
    const close = e.target.closest("[data-demo-close]");
    if(close && isOpen){
      e.preventDefault();
      closeDemo();
    }
  });

  // Esc closes
  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && isOpen) closeDemo();
  });

  // Mute toggle (hero mode)
  const heroBtn = getMuteBtn();
  if(heroBtn){
    heroBtn.addEventListener("click", (e)=>{
      e.preventDefault();
      toggleMute();
    });
  }

  // Mute toggle (fullscreen mode)
  document.addEventListener("click", (e)=>{
    if(e.target.id === "demoFsMute"){
      e.preventDefault();
      toggleMute();
    }
  });

  // Direct demo buttons (data-demo attribute)
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("[data-demo]");
    if(btn){
      e.preventDefault();
      const appKey = btn.dataset.demo;
      if(appKey) openDemo(appKey);
    }
  });
}

// Initialize bindings on load
bindOnce();
