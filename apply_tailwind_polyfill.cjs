const fs = require('fs');
const path = require('path');

const cssAdditions = `
/* =========================================
   TAILWIND POLYFILL & LEGACY ALIASES
   Added by Audit Phase 1 to fix broken UI
   ========================================= */

/* Typography & Colors */
.font-black { font-weight: 900; }
.font-medium { font-weight: 500; }
.font-mono { font-family: monospace; }
.text-slate-800, .text-slate-700 { color: var(--color-text); }
.text-slate-500, .text-slate-400, .text-slate-600 { color: var(--color-text-muted); }
.text-rose-500, .text-danger { color: var(--color-danger); }
.text-indigo-500, .text-primary { color: var(--color-primary); }
.text-success { color: var(--color-success); }
.text-warning { color: var(--color-warning); }
.text-info { color: var(--color-info); }
.bg-white, .bg-surface { background-color: var(--color-surface); }
.bg-slate-50, .bg-bg { background-color: var(--color-bg); }
.bg-slate-200 { background-color: var(--color-border-light); }
.bg-primary-light { background-color: var(--color-primary-light); }
.bg-primary { background-color: var(--color-primary); }
.bg-success { background-color: var(--color-success); }

/* Alignment & Text */
.text-center { text-align: center; }
.uppercase { text-transform: uppercase; }
.capitalize { text-transform: capitalize; }
.italic { font-style: italic; }
.tracking-widest { letter-spacing: 0.1em; }
.tracking-wider { letter-spacing: 0.05em; }
.tracking-tighter { letter-spacing: -0.05em; }
.leading-tight { line-height: 1.25; }

/* Display & Layout */
.block { display: block; }
.items-start { align-items: flex-start; }
.justify-end { justify-content: flex-end; }
.shrink-0, .flex-shrink-0 { flex-shrink: 0; }
.relative { position: relative; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.h-full { height: 100%; }
.w-full { width: 100%; }
.w-6 { width: 1.5rem; }
.h-6 { height: 1.5rem; }
.max-w-\\[200px\\] { max-width: 200px; }
.w-\\[80px\\] { width: 80px; }
.h-1\\.5 { height: 0.375rem; }

/* Spacing */
.mt-0\\.5 { margin-top: 0.125rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.mb-5 { margin-bottom: 1.25rem; }
.mb-8 { margin-bottom: 2rem; }
.pt-4 { padding-top: 1rem; }
.pt-6 { padding-top: 1.5rem; }
.pb-4 { padding-bottom: 1rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-8 { padding: 2rem; }
.gap-1 { gap: 0.25rem; }
.gap-8 { gap: 2rem; }
.space-y-2\\.5 > * + * { margin-top: 0.625rem; }
.space-y-3 > * + * { margin-top: 0.75rem; }
.space-y-4 > * + * { margin-top: 1rem; }

/* Borders & Shadows */
.border { border: 1px solid var(--color-border); }
.border-b { border-bottom: 1px solid var(--color-border-light); }
.border-t { border-top: 1px solid var(--color-border-light); }
.border-slate-200, .border-slate-100, .border-border-light { border-color: var(--color-border-light); }
.border-border { border-color: var(--color-border); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: calc(var(--radius-xl) * 1.5); }
.rounded-full { border-radius: 9999px; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }

/* Opacity & Transitions */
.opacity-0 { opacity: 0; }
.opacity-40 { opacity: 0.4; }
.opacity-50 { opacity: 0.5; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.group:hover .group-hover\\:opacity-100 { opacity: 1; }

/* Font Sizes */
.text-xl { font-size: 1.25rem; }
.text-lg { font-size: 1.125rem; }
.text-3xl { font-size: 1.875rem; }
.text-\\[10px\\] { font-size: 10px; }

/* Grid Specifics */
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.auto-rows-fr { grid-auto-rows: minmax(0, 1fr); }

/* Legacy CRM Component Aliases */
.page-container {
  padding: 1.5rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.card-panel {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}
.panel-title {
  font-size: 1.125rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 1rem;
}
.timeline {
  position: relative;
  padding-left: 2rem;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--color-border-light);
}
.timeline-item {
  position: relative;
  margin-bottom: 1.5rem;
}
.timeline-icon {
  position: absolute;
  left: -2rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 4px solid var(--color-surface);
  z-index: 10;
}
.timeline-content {
  background: var(--color-bg);
  padding: 1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}
.calendar-day {
  border-right: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
  min-height: 120px;
  padding: 0.5rem;
}
.day-header {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-muted);
  margin-bottom: 0.5rem;
}
`;

const indexCssPath = path.join(__dirname, 'src', 'index.css');
fs.appendFileSync(indexCssPath, cssAdditions);
console.log('Successfully appended Tailwind polyfills to index.css');
