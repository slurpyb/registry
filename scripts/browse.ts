/**
 * Ephemeral registry browser. Run: bun scripts/browse.ts
 * Opens a searchable, filterable UI for all registry components.
 * Enriched with taxonomy, skill-index, and skill-report data.
 */

import { Glob } from "bun"

const PORT = 3333
const ROOT = new URL("..", import.meta.url).pathname
const DIST = `${ROOT}dist`
const REG = `${ROOT}_registry`
const FILES = `${ROOT}files`

// ── Load core data ──────────────────────────────────────────────────
const indexData = await Bun.file(`${DIST}/index.json`).json()
const rawComponents: { name: string; type: string; description: string }[] = indexData.components ?? []

// ── Load enrichment: taxonomy ───────────────────────────────────────
const taxonomy: Record<string, any> = {}
try {
  for (const t of await Bun.file(`${REG}/taxonomy.json`).json()) taxonomy[t.name] = t
} catch { console.warn("  ⚠ taxonomy.json not found") }

// ── Load enrichment: skill-index ────────────────────────────────────
const skillIndex: Record<string, any> = {}
try {
  for (const s of await Bun.file(`${REG}/skill-index.json`).json()) skillIndex[s.name] = s
} catch { console.warn("  ⚠ skill-index.json not found") }

// ── Load enrichment: skill-reports (lightweight meta for list) ──────
const reportMeta: Record<string, { icon: string; riskLevel: string; safe: boolean }> = {}
const reportPaths: Record<string, string> = {} // name → full path for API

const glob = new Glob("skills/*/skill-report.json")
let reportCount = 0
for await (const path of glob.scan({ cwd: FILES })) {
  try {
    const fullPath = `${FILES}/${path}`
    const data = await Bun.file(fullPath).json()
    const name = data.skill?.name
    if (!name) continue
    reportMeta[name] = {
      icon: data.skill?.icon ?? "",
      riskLevel: data.security_audit?.risk_level ?? "",
      safe: data.security_audit?.safe_to_publish ?? true,
    }
    reportPaths[name] = fullPath
    reportCount++
  } catch { /* skip malformed */ }
}

// ── Merge everything ────────────────────────────────────────────────
const components = rawComponents.map(c => {
  const tax = taxonomy[c.name] ?? {}
  const si = skillIndex[c.name] ?? {}
  const rm = reportMeta[c.name] ?? {}
  return {
    name: c.name,
    type: c.type,
    description: c.description,
    domain: tax.domain ?? "",
    subdomain: tax.subdomain ?? "",
    specialty: tax.specialty ?? "",
    tags: tax.tags ?? si.tags ?? [],
    quality: tax.quality ?? 0,
    qualityReason: tax.qualityReason ?? "",
    bundleHints: tax.bundleHints ?? [],
    capabilities: si.capabilities ?? [],
    author: si.author ?? "",
    icon: rm.icon ?? "",
    riskLevel: rm.riskLevel ?? "",
    safe: rm.safe ?? true,
    hasReport: !!reportPaths[c.name],
  }
})

const domains = [...new Set(components.map(c => c.domain).filter(Boolean))].sort()
const types = [...new Set(components.map(c => c.type))].sort()

// ── HTML ────────────────────────────────────────────────────────────
const html = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OCX Registry Browser</title>
<style>
  :root { --bg: #0d1117; --surface: #161b22; --border: #30363d; --text: #e6edf3; --muted: #8b949e; --accent: #58a6ff; --green: #3fb950; --purple: #bc8cff; --orange: #d29922; --red: #f85149; --cyan: #39d353; --yellow: #e3b341; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }
  .layout { display: grid; grid-template-columns: 420px 1fr; height: 100vh; }

  .sidebar { border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
  .controls { padding: 12px; border-bottom: 1px solid var(--border); background: var(--surface); }
  .controls h1 { font-size: 15px; margin-bottom: 8px; color: var(--accent); }
  .controls input { width: 100%; padding: 8px 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 14px; outline: none; }
  .controls input:focus { border-color: var(--accent); }
  .filter-row { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
  .filter-row label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; width: 100%; margin-bottom: 2px; }
  .filter-row button { padding: 3px 8px; font-size: 11px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); color: var(--muted); cursor: pointer; transition: all 0.15s; }
  .filter-row button:hover { border-color: var(--accent); color: var(--text); }
  .filter-row button.active { border-color: var(--accent); color: var(--accent); background: rgba(88,166,255,0.1); }
  .filter-selects { display: flex; gap: 8px; margin-top: 8px; }
  .filter-selects select { flex: 1; padding: 5px 8px; font-size: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); outline: none; }
  .count { font-size: 12px; color: var(--muted); margin-top: 6px; display: flex; justify-content: space-between; }
  .sort-toggle { font-size: 11px; color: var(--accent); cursor: pointer; background: none; border: none; }

  .list { flex: 1; overflow-y: auto; }
  .item { padding: 10px 12px; border-bottom: 1px solid var(--border); cursor: pointer; }
  .item:hover { background: var(--surface); }
  .item.selected { background: rgba(88,166,255,0.08); border-left: 3px solid var(--accent); }
  .item-top { display: flex; align-items: center; gap: 6px; }
  .item-icon { font-size: 14px; width: 20px; text-align: center; flex-shrink: 0; }
  .item-name { font-size: 13px; font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .item-quality { font-size: 11px; color: var(--orange); white-space: nowrap; }
  .badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; white-space: nowrap; }
  .type-skill { background: rgba(63,185,80,0.15); color: var(--green); }
  .type-plugin { background: rgba(188,140,255,0.15); color: var(--purple); }
  .type-agent { background: rgba(210,153,34,0.15); color: var(--orange); }
  .type-bundle { background: rgba(248,81,73,0.15); color: var(--red); }
  .type-command { background: rgba(88,166,255,0.15); color: var(--accent); }
  .risk-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .risk-low { background: var(--green); }
  .risk-medium { background: var(--yellow); }
  .risk-high { background: var(--red); }
  .risk-critical { background: var(--red); box-shadow: 0 0 4px var(--red); }
  .item-domain { font-size: 10px; color: var(--cyan); margin-left: 26px; }
  .item-desc { font-size: 12px; color: var(--muted); margin-top: 3px; margin-left: 26px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .item-star { font-size: 12px; cursor: pointer; opacity: 0.3; flex-shrink: 0; }
  .item-star.is-starred { opacity: 1; color: var(--orange); }

  .main { overflow-y: auto; padding: 24px 32px; }
  .empty { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--muted); font-size: 14px; flex-direction: column; gap: 8px; }
  .empty kbd { background: var(--surface); border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
  .detail h2 { font-size: 22px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
  .detail .meta { font-size: 13px; color: var(--muted); margin-bottom: 16px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .meta-sep { color: var(--border); }
  .quality-stars { color: var(--orange); letter-spacing: 1px; }
  .detail .desc { font-size: 14px; line-height: 1.6; margin-bottom: 20px; padding: 12px; background: var(--surface); border-radius: 8px; border: 1px solid var(--border); }
  .section { margin-bottom: 20px; }
  .section h3 { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .tag-list { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: rgba(88,166,255,0.08); border: 1px solid rgba(88,166,255,0.2); color: var(--accent); cursor: default; }
  .tag.bundle-tag { background: rgba(188,140,255,0.08); border-color: rgba(188,140,255,0.2); color: var(--purple); }
  .tag.tool-tag { background: rgba(63,185,80,0.08); border-color: rgba(63,185,80,0.2); color: var(--green); }
  .tag.risk-tag { background: rgba(227,179,65,0.08); border-color: rgba(227,179,65,0.2); color: var(--yellow); }
  .cap-list { list-style: none; }
  .cap-list li { font-size: 13px; padding: 4px 0; padding-left: 16px; position: relative; }
  .cap-list li::before { content: ""; position: absolute; left: 0; top: 10px; width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
  .lim-list { list-style: none; }
  .lim-list li { font-size: 13px; padding: 4px 0; padding-left: 16px; position: relative; color: var(--muted); }
  .lim-list li::before { content: ""; position: absolute; left: 0; top: 10px; width: 6px; height: 6px; border-radius: 50%; background: var(--orange); }

  .security-box { padding: 12px; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 8px; }
  .security-box.risk-low { border-color: rgba(63,185,80,0.3); background: rgba(63,185,80,0.05); }
  .security-box.risk-medium { border-color: rgba(227,179,65,0.3); background: rgba(227,179,65,0.05); }
  .security-box.risk-high { border-color: rgba(248,81,73,0.3); background: rgba(248,81,73,0.05); }
  .security-box .risk-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .security-box .risk-label.low { color: var(--green); }
  .security-box .risk-label.medium { color: var(--yellow); }
  .security-box .risk-label.high { color: var(--red); }
  .security-summary { font-size: 13px; color: var(--text); margin-top: 6px; line-height: 1.5; }
  .finding { font-size: 12px; padding: 6px 10px; margin-top: 4px; border-radius: 4px; background: var(--bg); border: 1px solid var(--border); }
  .finding-title { font-weight: 600; }
  .finding-desc { color: var(--muted); margin-top: 2px; }

  .use-case { padding: 10px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); margin-bottom: 6px; }
  .use-case-title { font-size: 13px; font-weight: 600; }
  .use-case-user { font-size: 11px; color: var(--cyan); }
  .use-case-desc { font-size: 12px; color: var(--muted); margin-top: 4px; }

  .faq-item { border-bottom: 1px solid var(--border); padding: 8px 0; }
  .faq-q { font-size: 13px; font-weight: 600; cursor: pointer; }
  .faq-q:hover { color: var(--accent); }
  .faq-a { font-size: 13px; color: var(--muted); margin-top: 4px; line-height: 1.5; display: none; }
  .faq-a.open { display: block; }

  .prompt-tpl { padding: 8px 10px; border-radius: 6px; background: var(--surface); border: 1px solid var(--border); margin-bottom: 6px; }
  .prompt-title { font-size: 12px; font-weight: 600; }
  .prompt-scenario { font-size: 11px; color: var(--muted); }
  .prompt-text { font-size: 12px; font-family: 'SF Mono', monospace; color: var(--accent); margin-top: 4px; }

  .value-stmt { font-size: 13px; line-height: 1.6; color: var(--text); padding: 10px 12px; background: rgba(63,185,80,0.05); border: 1px solid rgba(63,185,80,0.15); border-radius: 8px; margin-bottom: 16px; }

  .files-header { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .file-link { display: block; padding: 6px 10px; font-size: 13px; font-family: 'SF Mono', monospace; color: var(--accent); cursor: pointer; border-radius: 4px; text-decoration: none; }
  .file-link:hover { background: var(--surface); }
  .file-content { margin-top: 16px; }
  .file-content h3 { font-size: 14px; margin-bottom: 8px; color: var(--muted); }
  .file-content pre { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-size: 13px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap; word-break: break-word; font-family: 'SF Mono', 'Fira Code', monospace; max-height: 70vh; overflow-y: auto; }
  .star-btn { background: none; border: none; cursor: pointer; font-size: 18px; }

  #starred-panel { padding: 12px; border-top: 1px solid var(--border); background: var(--surface); max-height: 200px; overflow-y: auto; display: none; }
  #starred-panel.has-items { display: block; }
  #starred-panel h3 { font-size: 12px; color: var(--orange); margin-bottom: 6px; }
  .starred-item { font-size: 12px; padding: 2px 0; display: flex; align-items: center; gap: 6px; cursor: pointer; }
  .starred-item:hover { color: var(--accent); }
  .starred-item .remove { cursor: pointer; color: var(--red); font-size: 10px; }
  .export-btn { font-size: 11px; padding: 2px 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--muted); cursor: pointer; float: right; }
  .export-btn:hover { border-color: var(--accent); color: var(--text); }

  .collapsible { cursor: pointer; user-select: none; }
  .collapsible::before { content: "▸ "; font-size: 11px; }
  .collapsible.open::before { content: "▾ "; }
  .collapsible-body { display: none; }
  .collapsible-body.open { display: block; }
</style>
</head>
<body>
<div class="layout">
  <div class="sidebar">
    <div class="controls">
      <h1>OCX Registry Browser</h1>
      <input id="search" type="text" placeholder="Search name, description, tags..." autofocus>
      <div class="filter-row" id="type-filters"><label>Type</label></div>
      <div class="filter-selects">
        <select id="domain-filter"><option value="">All domains</option></select>
        <select id="quality-filter">
          <option value="">Any quality</option>
          <option value="5">5 only</option>
          <option value="4">4+</option>
          <option value="3">3+</option>
        </select>
      </div>
      <div class="count" id="count">
        <span id="count-text"></span>
        <button class="sort-toggle" id="sort-toggle" title="Toggle sort">A-Z</button>
      </div>
    </div>
    <div class="list" id="list"></div>
    <div id="starred-panel">
      <h3>Starred <button class="export-btn" onclick="exportStarred()">Copy list</button></h3>
      <div id="starred-list"></div>
    </div>
  </div>
  <div class="main" id="main">
    <div class="empty">
      <div>Select a component to view details</div>
      <div><kbd>/</kbd> search · <kbd>j</kbd>/<kbd>k</kbd> navigate · <kbd>s</kbd> star</div>
    </div>
  </div>
</div>
<script>
const components = ${JSON.stringify(components)};
const domains = ${JSON.stringify(domains)};
const types = ${JSON.stringify(types)};
let activeType = null, activeDomain = '', minQuality = 0;
let sortMode = 'alpha';
let selected = null;
let starred = JSON.parse(localStorage.getItem('ocx-starred') || '[]');
const $ = id => document.getElementById(id);
const esc = s => s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

// Build filters
const typeContainer = $('type-filters');
types.forEach(t => { const b = document.createElement('button'); b.dataset.type = t; b.textContent = t; typeContainer.appendChild(b); });
const domSel = $('domain-filter');
domains.forEach(d => { const o = document.createElement('option'); o.value = d; o.textContent = d; domSel.appendChild(o); });

typeContainer.addEventListener('click', e => { const b = e.target.closest('button'); if (!b||!b.dataset.type) return; activeType = activeType===b.dataset.type ? null : b.dataset.type; render(); });
$('search').addEventListener('input', () => render());
$('domain-filter').addEventListener('change', e => { activeDomain = e.target.value; render(); });
$('quality-filter').addEventListener('change', e => { minQuality = parseInt(e.target.value)||0; render(); });
$('sort-toggle').addEventListener('click', () => { sortMode = sortMode==='alpha'?'quality':'alpha'; $('sort-toggle').textContent = sortMode==='alpha'?'A-Z':'Quality'; render(); });

document.addEventListener('keydown', e => {
  if (e.target.tagName==='INPUT'||e.target.tagName==='SELECT') { if (e.key==='Escape') { e.target.blur(); e.preventDefault(); } return; }
  if (e.key==='/') { e.preventDefault(); $('search').focus(); return; }
  if (e.key==='j'||e.key==='k') { const items=filtered(); if(!items.length)return; const idx=items.findIndex(c=>c.name===selected); const next=e.key==='j'?Math.min(idx+1,items.length-1):Math.max(idx-1,0); selected=items[next].name; render(); loadComponent(selected); document.querySelector('.item.selected')?.scrollIntoView({block:'nearest'}); }
  if (e.key==='s' && selected) toggleStar(selected);
});

function filtered() {
  const q = $('search').value.toLowerCase();
  let r = components.filter(c =>
    (!activeType || c.type===activeType) &&
    (!activeDomain || c.domain===activeDomain) &&
    (!minQuality || c.quality>=minQuality) &&
    (!q || c.name.includes(q) || (c.description||'').toLowerCase().includes(q) || c.tags.some(t=>t.toLowerCase().includes(q)) || c.domain.includes(q) || c.subdomain.includes(q) || c.specialty.toLowerCase().includes(q))
  );
  if (sortMode==='quality') r.sort((a,b)=>(b.quality||0)-(a.quality||0)||a.name.localeCompare(b.name));
  return r;
}

function stars(n) { return n>0 ? Array(n).fill('★').join('') : ''; }

function render() {
  const items = filtered();
  $('count-text').textContent = items.length + ' / ' + components.length;
  typeContainer.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.type===activeType));
  $('list').innerHTML = items.map(c => {
    const isStar = starred.includes(c.name);
    return '<div class="item '+(selected===c.name?'selected':'')+'" data-name="'+c.name+'">'
      +'<div class="item-top">'
      +'<span class="item-star '+(isStar?'is-starred':'')+'" data-star="'+c.name+'">'+(isStar?'★':'☆')+'</span>'
      +'<span class="item-icon">'+(c.icon||'')+'</span>'
      +'<span class="item-name">'+esc(c.name)+'</span>'
      +'<span class="badge type-'+c.type+'">'+c.type+'</span>'
      +(c.riskLevel?'<span class="risk-dot risk-'+c.riskLevel+'" title="Risk: '+c.riskLevel+'"></span>':'')
      +(c.quality?'<span class="item-quality">'+stars(c.quality)+'</span>':'')
      +'</div>'
      +(c.domain?'<div class="item-domain">'+esc(c.domain)+(c.subdomain?' / '+esc(c.subdomain):'')+'</div>':'')
      +'<div class="item-desc">'+esc(c.description)+'</div>'
      +'</div>';
  }).join('');
  renderStarred();
}

$('list').addEventListener('click', e => {
  const starEl = e.target.closest('[data-star]');
  if (starEl) { toggleStar(starEl.dataset.star); e.stopPropagation(); return; }
  const item = e.target.closest('.item');
  if (!item) return;
  selected = item.dataset.name;
  render();
  loadComponent(selected);
});

async function loadComponent(name) {
  const c = components.find(x => x.name===name) || {};
  const [compRes, reportRes] = await Promise.all([
    fetch('/api/component/'+name),
    c.hasReport ? fetch('/api/report/'+name) : Promise.resolve(null)
  ]);
  const data = await compRes.json();
  const report = reportRes ? await reportRes.json().catch(()=>null) : null;
  const ver = data.versions?.[data['dist-tags']?.latest] ?? {};
  const files = ver.files ?? [];
  const isStarred = starred.includes(name);
  const sk = report?.skill || {};
  const sec = report?.security_audit || {};
  const cnt = report?.content || {};

  let h = '<div class="detail">';

  // Header
  h += '<h2>'+(sk.icon||'')+' '+esc(name)+' <button class="star-btn" onclick="toggleStar(\\''+name+'\\')\">'+(isStarred?'★':'☆')+'</button></h2>';

  // Meta
  h += '<div class="meta">';
  h += '<span class="badge type-'+(c.type||'')+'">'+esc(c.type||'')+'</span>';
  if (c.domain) h += '<span class="meta-sep">|</span><span>'+esc(c.domain)+(c.subdomain?' / '+esc(c.subdomain):'')+'</span>';
  if (c.specialty) h += '<span class="meta-sep">|</span><span>'+esc(c.specialty)+'</span>';
  if (c.quality) h += '<span class="meta-sep">|</span><span class="quality-stars">'+stars(c.quality)+'</span><span style="font-size:11px;color:var(--muted)">'+(c.qualityReason?' '+esc(c.qualityReason):'')+'</span>';
  if (sk.author||c.author) h += '<span class="meta-sep">|</span><span style="color:var(--cyan)">by '+esc(sk.author||c.author)+'</span>';
  if (sk.version) h += '<span class="meta-sep">|</span><span>v'+esc(sk.version)+'</span>';
  if (sk.license) h += '<span class="meta-sep">|</span><span>'+esc(sk.license)+'</span>';
  h += '</div>';

  // Value statement
  if (cnt.value_statement) h += '<div class="value-stmt">'+esc(cnt.value_statement)+'</div>';

  // Description
  h += '<div class="desc">'+esc(c.description||'')+'</div>';

  // Security audit
  if (sec.risk_level) {
    h += '<div class="section"><h3>Security Audit</h3>';
    h += '<div class="security-box risk-'+sec.risk_level+'">';
    h += '<span class="risk-label '+sec.risk_level+'">'+sec.risk_level.toUpperCase()+' RISK</span>';
    if (sec.safe_to_publish===false) h += ' <span style="color:var(--red);font-size:12px;font-weight:600">⚠ NOT SAFE TO PUBLISH</span>';
    if (sec.summary) h += '<div class="security-summary">'+esc(sec.summary)+'</div>';
    h += '</div>';
    const allFindings = [...(sec.critical_findings||[]),...(sec.high_findings||[]),...(sec.medium_findings||[]),...(sec.low_findings||[])];
    if (allFindings.length) {
      allFindings.forEach(f => {
        h += '<div class="finding"><span class="finding-title">'+esc(f.title)+'</span><div class="finding-desc">'+esc(f.description)+'</div></div>';
      });
    }
    h += '</div>';
  }

  // Capabilities (prefer report, fallback to skill-index)
  const caps = cnt.actual_capabilities?.length ? cnt.actual_capabilities : c.capabilities;
  if (caps?.length) {
    h += '<div class="section"><h3>Capabilities</h3><ul class="cap-list">';
    caps.forEach(cap => { h += '<li>'+esc(cap)+'</li>'; });
    h += '</ul></div>';
  }

  // Limitations
  if (cnt.limitations?.length) {
    h += '<div class="section"><h3>Limitations</h3><ul class="lim-list">';
    cnt.limitations.forEach(l => { h += '<li>'+esc(l)+'</li>'; });
    h += '</ul></div>';
  }

  // Use cases
  if (cnt.use_cases?.length) {
    h += '<div class="section"><h3>Use Cases</h3>';
    cnt.use_cases.forEach(uc => {
      h += '<div class="use-case"><span class="use-case-user">'+esc(uc.target_user)+'</span> <span class="use-case-title">'+esc(uc.title)+'</span><div class="use-case-desc">'+esc(uc.description)+'</div></div>';
    });
    h += '</div>';
  }

  // Prompt templates
  if (cnt.prompt_templates?.length) {
    h += '<div class="section"><h3 class="collapsible" onclick="this.classList.toggle(\\'open\\');this.nextElementSibling.classList.toggle(\\'open\\')">Prompt Templates</h3><div class="collapsible-body">';
    cnt.prompt_templates.forEach(pt => {
      h += '<div class="prompt-tpl"><div class="prompt-title">'+esc(pt.title)+'</div><div class="prompt-scenario">'+esc(pt.scenario)+'</div><div class="prompt-text">'+esc(pt.prompt)+'</div></div>';
    });
    h += '</div></div>';
  }

  // Best practices & anti-patterns
  if (cnt.best_practices?.length) {
    h += '<div class="section"><h3 class="collapsible" onclick="this.classList.toggle(\\'open\\');this.nextElementSibling.classList.toggle(\\'open\\')">Best Practices</h3><div class="collapsible-body"><ul class="cap-list">';
    cnt.best_practices.forEach(bp => { h += '<li>'+esc(bp)+'</li>'; });
    h += '</ul></div></div>';
  }
  if (cnt.anti_patterns?.length) {
    h += '<div class="section"><h3 class="collapsible" onclick="this.classList.toggle(\\'open\\');this.nextElementSibling.classList.toggle(\\'open\\')">Anti-Patterns</h3><div class="collapsible-body"><ul class="lim-list">';
    cnt.anti_patterns.forEach(ap => { h += '<li>'+esc(ap)+'</li>'; });
    h += '</ul></div></div>';
  }

  // FAQ
  if (cnt.faq?.length) {
    h += '<div class="section"><h3 class="collapsible" onclick="this.classList.toggle(\\'open\\');this.nextElementSibling.classList.toggle(\\'open\\')">FAQ ('+cnt.faq.length+')</h3><div class="collapsible-body">';
    cnt.faq.forEach((f,i) => {
      h += '<div class="faq-item"><div class="faq-q" onclick="this.nextElementSibling.classList.toggle(\\'open\\')">'+esc(f.question)+'</div><div class="faq-a">'+esc(f.answer)+'</div></div>';
    });
    h += '</div></div>';
  }

  // Tags
  const allTags = [...new Set([...(c.tags||[]),...(sk.tags||[])])];
  if (allTags.length) {
    h += '<div class="section"><h3>Tags</h3><div class="tag-list">';
    allTags.forEach(t => { h += '<span class="tag">'+esc(t)+'</span>'; });
    h += '</div></div>';
  }

  // Supported tools
  if (sk.supported_tools?.length) {
    h += '<div class="section"><h3>Supported Tools</h3><div class="tag-list">';
    sk.supported_tools.forEach(t => { h += '<span class="tag tool-tag">'+esc(t)+'</span>'; });
    h += '</div></div>';
  }

  // Risk factors
  if (sk.risk_factors?.length) {
    h += '<div class="section"><h3>Risk Factors</h3><div class="tag-list">';
    sk.risk_factors.forEach(r => { h += '<span class="tag risk-tag">'+esc(r)+'</span>'; });
    h += '</div></div>';
  }

  // Bundle hints
  if (c.bundleHints?.length) {
    h += '<div class="section"><h3>Bundle Hints</h3><div class="tag-list">';
    c.bundleHints.forEach(b => { h += '<span class="tag bundle-tag">'+esc(b)+'</span>'; });
    h += '</div></div>';
  }

  // Files
  if (files.length) {
    h += '<div class="section"><div class="files-header">Files ('+files.length+')</div>';
    files.forEach(f => {
      h += '<a class="file-link" onclick="loadFile(\\''+name+'\\',\\''+f.path.replace(/'/g,"\\\\'")+'\\')">'+esc(f.path)+'</a>';
    });
    h += '</div>';
  }

  h += '<div id="file-content"></div></div>';
  $('main').innerHTML = h;
}

async function loadFile(component, path) {
  $('file-content').innerHTML = '<div style="color:var(--muted);padding:12px">Loading...</div>';
  const res = await fetch('/api/file/'+component+'/'+encodeURIComponent(path));
  const text = await res.text();
  $('file-content').innerHTML = '<div class="file-content"><h3>'+esc(path)+'</h3><pre>'+esc(text)+'</pre></div>';
}

function toggleStar(name) {
  const idx = starred.indexOf(name);
  if (idx>=0) starred.splice(idx,1); else starred.push(name);
  localStorage.setItem('ocx-starred', JSON.stringify(starred));
  if (selected===name) loadComponent(name);
  render();
}

function renderStarred() {
  const panel = $('starred-panel');
  panel.classList.toggle('has-items', starred.length>0);
  $('starred-list').innerHTML = starred.map(s =>
    '<div class="starred-item"><span class="remove" onclick="event.stopPropagation();removeStar(\\''+s+'\\')">x</span> <span onclick="selected=\\''+s+'\\';render();loadComponent(\\''+s+'\\')">' + esc(s) + '</span></div>'
  ).join('');
}

function removeStar(name) {
  starred = starred.filter(s=>s!==name);
  localStorage.setItem('ocx-starred', JSON.stringify(starred));
  renderStarred();
  if (selected===name) loadComponent(name);
}

function exportStarred() {
  navigator.clipboard.writeText(starred.join('\\n'));
  const btn = document.querySelector('.export-btn');
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy list', 1500);
}

render();
</script>
</body>
</html>`

// ── Server ──────────────────────────────────────────────────────────
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const path = url.pathname

  if (path === "/" || path === "")
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } })

  if (path.startsWith("/api/component/")) {
    const name = path.slice("/api/component/".length)
    const file = Bun.file(`${DIST}/components/${name}.json`)
    return (await file.exists())
      ? new Response(await file.text(), { headers: { "content-type": "application/json" } })
      : new Response("{}", { status: 404 })
  }

  if (path.startsWith("/api/report/")) {
    const name = path.slice("/api/report/".length)
    const fullPath = reportPaths[name]
    if (fullPath) {
      const file = Bun.file(fullPath)
      return (await file.exists())
        ? new Response(await file.text(), { headers: { "content-type": "application/json" } })
        : new Response("{}", { status: 404 })
    }
    return new Response("{}", { status: 404 })
  }

  if (path.startsWith("/api/file/")) {
    const rest = path.slice("/api/file/".length)
    const slashIdx = rest.indexOf("/")
    const component = rest.slice(0, slashIdx)
    const filePath = decodeURIComponent(rest.slice(slashIdx + 1))
    const file = Bun.file(`${DIST}/components/${component}/${filePath}`)
    return (await file.exists())
      ? new Response(await file.text(), { headers: { "content-type": "text/plain" } })
      : new Response("Not found", { status: 404 })
  }

  return new Response("Not found", { status: 404 })
}

console.log(`
  Registry browser → http://localhost:${PORT}
  ${components.length} components loaded
  Enrichment: ${Object.keys(taxonomy).length} taxonomy | ${Object.keys(skillIndex).length} skill-index | ${reportCount} skill-reports
  Ctrl+C to stop
`)

Bun.serve({ port: PORT, fetch: handler })
