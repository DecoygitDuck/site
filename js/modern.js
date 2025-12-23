/* Auto-split from app.js */
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

export function buildModernProjects(){
  const grid = document.getElementById('boringProjectsGrid');
  if(!grid) return;
  grid.innerHTML = "";
  const cards = Array.from(document.querySelectorAll('#terminalSite .card'));
  cards.forEach((c)=>{
    const title = (c.querySelector('h3')?.textContent || "Project").trim();
    const tag = (c.querySelector('.tag')?.textContent || "").trim();
    const desc = (c.querySelector('.desc')?.textContent || "").trim();
    const key  = (c.getAttribute('data-app') || "").trim();
    const wrap = document.createElement('div');
    wrap.className = 'pCard';
    const media = document.createElement('div');
    media.className = 'pMedia';
    const prev = c.querySelector('.preview')?.cloneNode(true);
    if(prev){
      // drop terminal-like framing; keep the little "character" previews
      prev.style.marginTop = "0";
      prev.style.border = "1px solid rgba(15,23,42,.10)";
      prev.style.background = "linear-gradient(180deg, rgba(37,99,235,.06), rgba(16,185,129,.05)), #ffffff";
      media.appendChild(prev);
    }
    const top = document.createElement('div');
    top.className = 'pTop';
    const h = document.createElement('h3');
    h.textContent = title;
    const t = document.createElement('div');
    t.className = 'pTag';
    t.textContent = tag || 'PROJECT';
    top.appendChild(h);
    top.appendChild(t);
    const p = document.createElement('p');
    p.className = 'pDesc';
    p.textContent = desc || 'Details coming soon.';
    const meta = document.createElement('div');
    meta.className = 'pMeta';
    meta.innerHTML = `<span>${key || 'app'}</span><span>preview-only</span><span>open | demo</span>`;
    const actions = document.createElement('div');
    actions.className = 'pActions';
    const openBtn = document.createElement('button');
    openBtn.className = 'bBtn';
    openBtn.type = 'button';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', ()=>{
      termRun(`open ${key || title.toLowerCase()}`);
      toast(`Open is coming soon for ${title}`);
    });
    const demoBtn = document.createElement('button');
    demoBtn.className = 'bBtn bGhost';
    demoBtn.type = 'button';
    demoBtn.textContent = 'Demo';
    demoBtn.addEventListener('click', ()=>{
      termRun(`demo ${key || title.toLowerCase()}`);
      toast(`Demo is preview-only for ${title}`);
    });
    actions.appendChild(openBtn);
    actions.appendChild(demoBtn);
    wrap.appendChild(media);
    wrap.appendChild(top);
    wrap.appendChild(p);
    wrap.appendChild(meta);
    wrap.appendChild(actions);
    grid.appendChild(wrap);
  });
  const y = document.getElementById('bYear');
  if(y) y.textContent = new Date().getFullYear();
}

export function bindModernButtons(runCmd){
  const root = document.getElementById('boringSite');
  if(!root) return;
  root.querySelectorAll('[data-bcmd]').forEach((btn)=>{
    btn.addEventListener('click', ()=>{
      const cmd = btn.getAttribute('data-bcmd') || '';
      if(cmd.trim()) runCmd(cmd);
    });
  });
}

