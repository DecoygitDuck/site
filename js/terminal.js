import { openDemo } from "./demo.js";
/* Auto-split from app.js */
import { APPS, CMDS } from "./apps.js";
import { themes, setTheme } from "./themes.js";

let termOut = null;
let termInput = null;

export function initTerminal(){
  termOut = document.getElementById('termOut');
  termInput = document.getElementById('termInput');

  // Banner (matches prior behavior)
  if(termOut){
    termPrint("rjo-dev shell v0.3 — type 'help' to see commands.", "m");
    termPrint("try: theme boring   (full site transform)", "m");
  }

  // Click-to-focus terminal
  document.getElementById('terminal')?.addEventListener('click', ()=> termInput?.focus());

  // Keyboard controls (enter / history / tab)
  window.addEventListener('keydown', (e)=>{
    if(!termInput) return;

    // Optional: Ctrl/Cmd+T focuses terminal input
    if((e.key === 't' || e.key === 'T') && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      termInput.focus();
      return;
    }
    if(document.activeElement !== termInput) return;

    if(e.key === 'Enter'){
      e.preventDefault();
      termRun();
      return;
    }
    if(e.key === 'ArrowUp'){
      e.preventDefault();
      if(hist.length === 0) return;
      histIdx = Math.max(0, histIdx - 1);
      termInput.value = hist[histIdx] ?? "";
      termInput.setSelectionRange(termInput.value.length, termInput.value.length);
      return;
    }
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      if(hist.length === 0) return;
      histIdx = Math.min(hist.length, histIdx + 1);
      termInput.value = histIdx >= hist.length ? "" : (hist[histIdx] ?? "");
      termInput.setSelectionRange(termInput.value.length, termInput.value.length);
      return;
    }
    if(e.key === 'Tab'){
      e.preventDefault();
      const v = (termInput.value || "").trim();
      if(!v) return;
      const parts = v.split(/\s+/);
      if(parts.length === 1){
        const base = parts[0].toLowerCase();
        const hit = CMDS.find(c => c.startsWith(base));
        if(hit) termInput.value = hit + " ";
      } else if(parts.length === 2 && parts[0].toLowerCase() === 'open'){
        const base = parts[1].toLowerCase();
        const keys = Object.keys(APPS);
        const hit = keys.find(k => k.startsWith(base));
        if(hit) termInput.value = "open " + hit;
      } else if(parts.length === 2 && parts[0].toLowerCase() === 'demo'){
        const base = parts[1].toLowerCase();
        const keys = Object.keys(APPS);
        const hit = keys.find(k => k.startsWith(base));
        if(hit) termInput.value = "demo " + hit;
      } else if(parts.length === 2 && parts[0].toLowerCase() === 'theme'){
        const base = parts[1].toLowerCase();
        const keys = Object.keys(themes);
        const hit = keys.find(k => k.startsWith(base));
        if(hit) termInput.value = "theme " + hit;
      }
    }
  });

  return { termOut, termInput };
}


let hist = [];
let histIdx = -1;
function escapeHtml(s){
  return (s+"").replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}
function termDivider(){
  if(!termOut) return;
  const d = document.createElement('div');
  d.className = 'termDivider';
  termOut.appendChild(d);
}
function termEcho(cmd){
  if(!termOut) return;
  const line = document.createElement('div');
  line.className = 'termLine';
  line.innerHTML = `<span class="p">C:\\rjo-dev&gt;</span><span class="t"> ${escapeHtml(cmd)}</span>`;
  termOut.appendChild(line);
  termOut.scrollTop = termOut.scrollHeight;
}
function termPrint(text, kind="t"){
  if(!termOut) return;
  const line = document.createElement('div');
  line.className = 'termLine';
  const p = document.createElement('span');
  p.className = 'p';
  p.textContent = "C:\\rjo-dev>";
  const t = document.createElement('span');
  t.className = kind;
  t.textContent = " " + text;
  line.appendChild(p);
  line.appendChild(t);
  termOut.appendChild(line);
  termOut.scrollTop = termOut.scrollHeight;
}
function pulseSphere(){
  const s = document.querySelector('.siteSphere');
  if(!s) return;
  s.animate(
    [
      { transform: 'translate(0,0) scale(1)', filter: 'saturate(1.18) contrast(1.02)' },
      { transform: 'translate(-10px, 6px) scale(1.09)', filter: 'saturate(1.3) contrast(1.08)' },
      { transform: 'translate(-4px, 10px) scale(1.02)', filter: 'saturate(1.18) contrast(1.02)' },
    ],
    { duration: 520, easing: 'cubic-bezier(.2,.85,.2,1)' }
  );
}
function spark(el){
  if(!el?.animate) return;
  el.animate(
    [
      { background:'rgba(37,99,235,.10)', borderColor:'rgba(37,99,235,.35)' },
      { background:'rgba(255,255,255,.80)', borderColor:'rgba(15,23,42,.10)' }
    ],
    { duration: 360, easing:'cubic-bezier(.2,.85,.2,1)' }
  );
}
function toast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), 2400);
}
function openApp(key, kind="open"){
  const a = APPS[key];
  if(!a) return false;


  // ✅ Only secret apps are real-launch. Everything else stays preview-only.
  if(key === "notes" || key === "boom" || key === "beausphere" || key === "egg"){
    termPrint(`launching ${a.name.toLowerCase()}...`, "m");
    setTimeout(() => { window.location.href = a.href; }, 120);
    return true;
  }

  // Original preview-only behavior
  const name = a.name.toLowerCase();
  termPrint(`${kind === "demo" ? "demo" : "launching"} ${name}...`, "m");
  setTimeout(()=>{
    termPrint("status: preview-only (launch disabled)", "m");
    termPrint("hint: wiring opens later", "m");
  }, 240);
  return true;
}
export function termRun(raw){
  const input = (raw ?? termInput?.value ?? "").trim();
  if(!input) return;
  hist.push(input);
  histIdx = hist.length;
  // echo only when user typed in terminal (not when buttons call it)
  if(raw === undefined) termEcho(input);
  const parts = input.split(/\s+/);
  const cmd = (parts[0] || "").toLowerCase();
  const arg1 = (parts[1] || "").toLowerCase();
  switch(cmd){
    case "help":
      termDivider();
      termPrint("commands:", "m");
      termPrint("  list                           (show apps)", "m");
      termPrint("  open <orby|cube|notecenter|wordbeat|hophop>", "m");
      termPrint("  (secret) open notes", "m");
      termPrint("  (secret) open boom", "m");
      termPrint("  (secret) open egg", "m");
      termPrint("  (secret) open beausphere", "m");
      termPrint("  demo <app>                      (preview-only)", "m");
      termPrint("  ping                           (pulse the hero sphere)", "m");
      termPrint("  about | contact                (jump)", "m");
      termPrint("  theme <green|blue|amber|boring> (boring = full site transform)", "m");
      termPrint("  clear                          (wipe terminal)", "m");
      break;
    case "list":
      termDivider();
      termPrint("apps:", "m");
      Object.entries(APPS).forEach(([k,a])=>{
        if (a.tag === "HIDDEN") return;
        termPrint(`  ${k.padEnd(10)} ${a.tag.padEnd(6)}  open ${k} | demo ${k}`, "m");
      });
      break;
    case "open":
      if(!arg1){ termPrint("usage: open <orby|cube|notecenter|wordbeat|hophop>", "err"); break; }
      if(!openApp(arg1, "open")) termPrint(`unknown app: ${arg1}`, "err");
      break;
    case "demo":
      if(!arg1){ termPrint("usage: demo <orby|cube|notecenter|wordbeat|hophop>", "err"); break; }
      if(APPS[arg1]){
        const card = document.querySelector(`article.card[data-app="${arg1}"]`);
        if(card) spark(card);
        termPrint(`launching ${APPS[arg1].name} demo...`, "m");
        // Open the demo (works in both terminal and boring modes now)
        setTimeout(() => openDemo(arg1), 150);
      } else {
        termPrint(`unknown app: ${arg1}`, "err");
      }
      break;
    case "ping":
      pulseSphere();
      termPrint("ping sent.", "m");
      break;
    case "about":
      document.getElementById('about')?.scrollIntoView({behavior:'smooth'});
      termPrint("jumping to about…", "m");
      break;
    case "contact":
      document.getElementById('contact')?.scrollIntoView({behavior:'smooth'});
      termPrint("jumping to contact…", "m");
      break;
    case "theme":
      if(!arg1){ termPrint("usage: theme <green|blue|amber|boring>", "err"); break; }
      if(setTheme(arg1)) termPrint(`theme set: ${arg1}`, "m");
      else termPrint(`unknown theme: ${arg1}`, "err");
      break;
    case "clear":
      if(termOut) termOut.innerHTML = "";
      break;
    default:
      termPrint(`unknown command: ${cmd}  (try: help)`, "err");
  }
  if(termInput && raw === undefined) termInput.value = "";
  if(termOut) termOut.scrollTop = termOut.scrollHeight;
}

