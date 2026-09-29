const $ = (s) => document.querySelector(s);
let snapshot = null;
let deferredInstallPrompt = null;

function fmtDate(v){
  if(!v) return 'ще немає';
  const d=new Date(v);
  return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('uk-UA',{dateStyle:'medium',timeStyle:'short'}).format(d);
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}

function render(filter=''){
  if(!snapshot) return;
  const q=filter.trim().toLowerCase();
  $('#updatedAt').textContent=fmtDate(snapshot.fetched_at || snapshot.capturedAt);
  $('#dataState').textContent=snapshot.fetched_at ? (navigator.onLine ? 'Актуальні' : 'Офлайн-копія') : 'Очікується перше оновлення';
  $('#rawText').textContent=snapshot.bodyText || '';

  const sections=(snapshot.sections||[]).filter(x=>!q || `${x.title} ${x.text}`.toLowerCase().includes(q));
  const useful=sections.filter(s=>s.title && !/^BADK Live$/i.test(s.title)).slice(0,8);
  $('#summary').innerHTML=useful.length ? useful.map(s=>`<article class="summary-card"><strong>${esc(s.title)}</strong><div class="muted">${esc((s.text||'').slice(0,380)) || 'Дані є в оригінальному джерелі.'}</div></article>`).join('') : '<div class="empty">Нічого не знайдено.</div>';

  const tables=(snapshot.tables||[]).map(t=>({ ...t, rows:(t.rows||[]).filter(r=>!q || r.join(' ').toLowerCase().includes(q))})).filter(t=>t.rows.length);
  $('#tables').innerHTML=tables.length ? tables.slice(0,10).map((t)=>{
    const rows=t.rows.slice(0,80);
    const cols=Math.max(...rows.map(r=>r.length));
    const normalized=rows.map(r=>Array.from({length:cols},(_,i)=>r[i]||''));
    const [head,...body]=normalized;
    return `<div class="table-wrap"><table><thead><tr>${head.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }).join('') : '<div class="empty">У поточному знімку таблиці не знайдені або не збігаються з пошуком.</div>';

  $('#sections').innerHTML=sections.length ? sections.map(s=>`<article class="card"><h3>${esc(s.title)}</h3><p>${esc((s.text||'').slice(0,1200))}</p></article>`).join('') : '<div class="empty">Немає результатів.</div>';
}

async function load(){
  $('#dataState').textContent='Оновлення…';
  try{
    const r=await fetch(`./data/snapshot.json?t=${Date.now()}`,{cache:'no-store'});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    snapshot=await r.json();
    render($('#search').value);
  }catch(e){
    if(snapshot){
      render($('#search').value);
      $('#dataState').textContent='Офлайн-копія';
    } else {
      $('#dataState').textContent='Помилка завантаження';
      $('#summary').innerHTML=`<div class="empty">${esc(e.message)}</div>`;
    }
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $('#installBtn').hidden = false;
});

$('#installBtn').addEventListener('click', async () => {
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $('#installBtn').hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  $('#installBtn').hidden = true;
});

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}

$('#refreshBtn').addEventListener('click',load);
$('#search').addEventListener('input',e=>render(e.target.value));
window.addEventListener('online',load);
window.addEventListener('offline',()=>snapshot && render($('#search').value));
load();
setInterval(load,10*60*1000);
