/**
 * Walletly (FinSmart Thai) - Main Application Controller
 * Handles view switching, dropdown events, drag-to-pan canvas, and inspector panel.
 */

// Application State
let currentDomainKey = 'core';
let currentView = 'dropdown';

// Canvas Pan & Zoom State
let panX = 40;
let panY = 20;
let canvasScale = 0.82;
let isDragging = false;
let startPointerX = 0;
let startPointerY = 0;

function ensureFullDiagramRendered() {
  const stage = document.getElementById('drag-stage-element');
  if (stage && !stage.querySelector('svg')) {
    stage.innerHTML = renderFullDiagramSvg();
  }
}

// ================= VIEW SWITCHER =================
function switchView(viewName) {
  currentView = viewName;
  const dropdownView = document.getElementById('dropdown-view');
  const canvasView = document.getElementById('canvas-view');
  const tabDropdown = document.getElementById('tab-dropdown-mode');
  const tabCanvas = document.getElementById('tab-canvas-mode');

  if (viewName === 'dropdown') {
    dropdownView.style.display = 'flex';
    canvasView.classList.remove('active-view');
    tabDropdown.classList.add('active');
    tabCanvas.classList.remove('active');
  } else {
    dropdownView.style.display = 'none';
    canvasView.classList.add('active-view');
    tabDropdown.classList.remove('active');
    tabCanvas.classList.add('active');
    
    // Ensure full diagram SVG is populated
    ensureFullDiagramRendered();
    
    setTimeout(() => {
      resetCanvasPosition();
      highlightCanvasDomain(currentDomainKey);
    }, 40);
  }
}

// ================= DROPDOWN EXPLORER HANDLER =================
function onDomainChange(domainKey) {
  currentDomainKey = domainKey;
  const data = DOMAIN_DATA[domainKey] || DOMAIN_DATA.core;

  // 1. Update Header Banner
  document.getElementById('banner-title').innerText = data.title;
  document.getElementById('banner-desc').innerText = data.desc;
  document.getElementById('stat-table-count').innerText = data.tableCount;
  document.getElementById('stat-fk-count').innerText = data.fkCount;

  // 2. Render Focused Sub-Diagram
  const svgWrap = document.getElementById('subdiagram-wrap');
  svgWrap.innerHTML = data.renderSvg();

  // 3. Render Table Specification Cards
  const gridContainer = document.getElementById('tables-grid-container');
  gridContainer.innerHTML = '';

  data.tables.forEach(tableName => {
    const table = TABLE_SCHEMAS[tableName];
    if (!table) return;

    const card = document.createElement('div');
    card.className = 'table-spec-card';
    card.id = `spec-card-${tableName}`;

    // Relations tags
    let relationsHtml = '';
    if (table.relationsIn && table.relationsIn.length > 0) {
      relationsHtml += table.relationsIn.map(r => `<span class="relation-pill" title="ขาเข้า">📥 ${r}</span>`).join(' ');
    }
    if (table.relationsOut && table.relationsOut.length > 0) {
      relationsHtml += table.relationsOut.map(r => `<span class="relation-pill" title="ขาออก">📤 ${r}</span>`).join(' ');
    }

    // Fields rows
    let rowsHtml = '';
    table.fields.forEach(f => {
      let kb = '';
      if (f.key === 'PK') kb = '<span class="key-badge kb-pk">PK</span>';
      else if (f.key === 'FK') kb = '<span class="key-badge kb-fk">FK</span>';
      else if (f.key === 'UQ') kb = '<span class="key-badge kb-uq">UQ</span>';

      rowsHtml += `
        <tr>
          <td><div class="col-name">${f.name} ${kb}</div></td>
          <td><span class="col-type">${f.type}</span></td>
          <td><span class="col-note">${f.note}</span></td>
        </tr>
      `;
    });

    card.innerHTML = `
      <div class="table-spec-header">
        <div class="table-name-title">
          <span>${table.title}</span>
        </div>
        <span class="badge-tag ${table.badgeClass}">${table.badge}</span>
      </div>
      <div class="table-spec-body">
        <div class="table-purpose">${table.desc}</div>
        <table class="columns-list">
          <thead>
            <tr>
              <th style="width: 36%;">คอลัมน์</th>
              <th style="width: 28%;">DATA TYPE</th>
              <th>คำอธิบาย / หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
      <div class="table-spec-footer">
        <div>${relationsHtml}</div>
        <button class="btn" style="padding: 0.28rem 0.65rem; font-size: 0.74rem;" onclick="openInspector('${tableName}')">🔍 ดูพจนานุกรม</button>
      </div>
    `;
    gridContainer.appendChild(card);
  });

  // Highlight on canvas if in canvas view
  if (currentView === 'canvas') {
    highlightCanvasDomain(domainKey);
  }
}

// Quick Jump Table Selection
function onTableSelect(tableName) {
  if (!tableName) return;

  const tableData = TABLE_SCHEMAS[tableName];
  if (!tableData) return;

  // Switch domain dropdown to table's domain
  const domainSelect = document.getElementById('domain-select');
  domainSelect.value = tableData.domain;
  onDomainChange(tableData.domain);

  // If in Dropdown mode: Smoothly scroll to the target card
  if (currentView === 'dropdown') {
    setTimeout(() => {
      const card = document.getElementById(`spec-card-${tableName}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.borderColor = '#F59E0B';
        card.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.45)';
        setTimeout(() => {
          card.style.borderColor = '';
          card.style.boxShadow = '';
        }, 2500);
      }
    }, 120);
  } else {
    // If in Canvas mode: Pan canvas directly to node
    panToCanvasNode(`full-node-${tableName}`);
  }
}

// ================= DRAG & PAN CANVAS LOGIC =================
const dragContainer = document.getElementById('canvas-drag-container');
const dragStage = document.getElementById('drag-stage-element');
const zoomBadge = document.getElementById('canvas-zoom-badge');

function applyTransform() {
  if (!dragStage) return;
  dragStage.style.transform = `translate(${panX}px, ${panY}px) scale(${canvasScale})`;
  if (zoomBadge) zoomBadge.innerText = `${Math.round(canvasScale * 100)}%`;
}

function zoomIn() {
  canvasScale = Math.min(2.2, canvasScale + 0.15);
  applyTransform();
}

function zoomOut() {
  canvasScale = Math.max(0.35, canvasScale - 0.15);
  applyTransform();
}

function resetCanvasPosition() {
  const containerWidth = (dragContainer && dragContainer.clientWidth > 100) ? dragContainer.clientWidth : window.innerWidth;
  canvasScale = Math.max(0.45, Math.min(0.85, (containerWidth - 60) / 2450));
  panX = 30;
  panY = 20;
  applyTransform();
}

function panToCanvasNode(nodeId) {
  const el = document.getElementById(nodeId);
  if (!el || !dragContainer) return;

  document.querySelectorAll('.full-node').forEach(n => n.classList.remove('selected'));
  el.classList.add('selected');

  const transformAttr = el.getAttribute('transform');
  const match = /translate\(([\d.-]+),\s*([\d.-]+)\)/.exec(transformAttr);
  if (match) {
    const nodeX = parseFloat(match[1]);
    const nodeY = parseFloat(match[2]);

    panX = (dragContainer.clientWidth / 2) - (nodeX * canvasScale) - (150 * canvasScale);
    panY = (dragContainer.clientHeight / 2) - (nodeY * canvasScale) - (100 * canvasScale);
    applyTransform();
  }
}

// Mouse drag events for Canvas
if (dragContainer) {
  dragContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.canvas-controls-floating') || e.target.closest('.full-node')) return;
    isDragging = true;
    dragContainer.classList.add('grabbing');
    startPointerX = e.clientX - panX;
    startPointerY = e.clientY - panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panX = e.clientX - startPointerX;
    panY = e.clientY - startPointerY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (dragContainer) dragContainer.classList.remove('grabbing');
  });

  // Mouse wheel zoom
  dragContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    canvasScale = Math.min(2.5, Math.max(0.35, canvasScale * zoomFactor));
    applyTransform();
  }, { passive: false });
}

function highlightCanvasDomain(domain) {
  const allNodes = document.querySelectorAll('.full-node');
  const allLines = document.querySelectorAll('.rel-line');

  if (domain === 'all') {
    allNodes.forEach(n => n.style.opacity = '1');
    allLines.forEach(l => l.style.opacity = '0.75');
    return;
  }

  allNodes.forEach(n => {
    if (n.classList.contains(domain)) {
      n.style.opacity = '1';
    } else {
      n.style.opacity = '0.14';
    }
  });

  allLines.forEach(l => {
    if (l.classList.contains(domain)) {
      l.style.opacity = '1';
      l.style.strokeWidth = '3px';
    } else {
      l.style.opacity = '0.05';
    }
  });
}

// ================= INSPECTOR PANEL LOGIC =================
function openInspector(tableName) {
  const table = TABLE_SCHEMAS[tableName];
  if (!table) return;

  document.getElementById('inspector-title').innerText = table.title;
  document.getElementById('inspector-badge').innerText = table.badge;
  document.getElementById('table-desc').innerText = table.desc;

  const container = document.getElementById('field-list-container');
  container.innerHTML = '';

  table.fields.forEach(f => {
    let keyBadge = '';
    if (f.key === 'PK') keyBadge = '<span class="key-badge kb-pk">PK</span>';
    else if (f.key === 'FK') keyBadge = '<span class="key-badge kb-fk">FK</span>';
    else if (f.key === 'UQ') keyBadge = '<span class="key-badge kb-uq">UQ</span>';

    const row = document.createElement('div');
    row.className = 'field-row';
    row.innerHTML = `
      <div class="field-header">
        <span class="field-name">${f.name} ${keyBadge}</span>
        <span class="field-type">${f.type}</span>
      </div>
      <div class="field-note">${f.note}</div>
    `;
    container.appendChild(row);
  });

  document.getElementById('inspector-panel').classList.add('open');
  document.getElementById('inspector-backdrop').classList.add('open');
}

function closeInspector() {
  document.getElementById('inspector-panel').classList.remove('open');
  document.getElementById('inspector-backdrop').classList.remove('open');
}

function toggleInspector() {
  const panel = document.getElementById('inspector-panel');
  if (panel.classList.contains('open')) {
    closeInspector();
  } else {
    openInspector('transactions');
  }
}

// Alias for inline SVG onclick
function inspectTable(tableName) {
  openInspector(tableName);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => alert(err.message));
    const icon = document.getElementById('fs-icon');
    if (icon) icon.innerText = '🗗';
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    const icon = document.getElementById('fs-icon');
    if (icon) icon.innerText = '🖥️';
  }
}

// ================= INITIALIZATION =================
function initApp() {
  ensureFullDiagramRendered();
  onDomainChange(currentDomainKey || 'core');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
