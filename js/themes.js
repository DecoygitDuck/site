/* Auto-split from app.js */
import { buildModernProjects, bindModernButtons } from "./modern.js";

export const themes = {
  // terminal vibes (default)
  green: {
    mode:"terminal",
    accent:"#5cffc6", accent2:"#86d8ff",    accentRGB:"92,255,198", accent2RGB:"134,216,255",
    bg:"#050607", bg2:"#07090b", panel:"#0a0d10",
    text:"#d7ffe9", muted:"rgba(215,255,233,.62)",
    borderSoft:"rgba(255,255,255,.08)", borderAccent:"rgba(92,255,198,.28)",
    fontMain:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    letter:".02em"
  },
  blue: {
    mode:"terminal",
    accent:"#86d8ff", accent2:"#5cffc6",    accentRGB:"134,216,255", accent2RGB:"92,255,198",
    bg:"#050607", bg2:"#07090b", panel:"#0a0d10",
    text:"#d7ffe9", muted:"rgba(215,255,233,.62)",
    borderSoft:"rgba(255,255,255,.08)", borderAccent:"rgba(92,255,198,.28)",
    fontMain:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    letter:".02em"
  },
  amber: {
    mode:"terminal",
    accent:"#ffcf5c", accent2:"#ff8fd6",    accentRGB:"255,207,92", accent2RGB:"255,143,214",
    bg:"#050607", bg2:"#07090b", panel:"#0a0d10",
    text:"#fff4dc", muted:"rgba(255,244,220,.62)",
    borderSoft:"rgba(255,255,255,.08)", borderAccent:"rgba(255,207,92,.30)",
    fontMain:'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    letter:".02em"
  },
  // "boring" = different site entirely (modern/professional)
  boring: {
    mode:"boring",
    bg:"#f8fafc", bg2:"#eef2f7", panel:"#ffffff",
    text:"#0b1220", muted:"rgba(11,18,32,.70)",
    accent:"#2563eb", accent2:"#14b8a6",    accentRGB:"37,99,235", accent2RGB:"20,184,166",
    borderSoft:"rgba(11,18,32,.10)", borderAccent:"rgba(37,99,235,.22)",
    fontMain:'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    letter:"0em"
  }
};
export function setTheme(name){
  const t = themes[name];
  if(!t) return false;
  const boring = (name === 'boring');
  document.body.classList.toggle('mode-boring', boring);
  const bs = document.getElementById('boringSite');
  const ts = document.getElementById('terminalSite');
  if(bs) bs.setAttribute('aria-hidden', boring ? 'false' : 'true');
  if(ts) ts.setAttribute('aria-hidden', boring ? 'true' : 'false');
  document.body.dataset.mode = t.mode || "terminal";
  // palette
  if(t.bg)  document.documentElement.style.setProperty('--bg', t.bg);
  if(t.bg2) document.documentElement.style.setProperty('--bg2', t.bg2);
  if(t.panel) document.documentElement.style.setProperty('--panel', t.panel);
  if(t.text) document.documentElement.style.setProperty('--text', t.text);
  if(t.muted) document.documentElement.style.setProperty('--muted', t.muted);
  // accents + borders
  if(t.accent)  document.documentElement.style.setProperty('--accent', t.accent);
  if(t.accent2) document.documentElement.style.setProperty('--accent2', t.accent2);
  if(t.accentRGB) document.documentElement.style.setProperty('--accent-rgb', t.accentRGB);
  if(t.accent2RGB) document.documentElement.style.setProperty('--accent2-rgb', t.accent2RGB);
  if(t.borderSoft)   document.documentElement.style.setProperty('--border-soft', t.borderSoft);
  if(t.borderAccent) document.documentElement.style.setProperty('--border-accent', t.borderAccent);
  // typography
  if(t.fontMain) document.documentElement.style.setProperty('--font-main', t.fontMain);
  if(t.letter)   document.documentElement.style.setProperty('--letter', t.letter);
  // persist theme
  try{ localStorage.setItem('theme', name); }catch(e){}

  // build boring-mode content on demand
  if(boring){
    buildModernProjects();
    bindModernButtons(window.termRun || (()=>{}));
  }
  return true;
}
/* ===== Command handler ===== */

