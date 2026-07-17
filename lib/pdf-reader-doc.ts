// The HTML document for the PDF Reader's WebView. Renders the real PDF with
// pdf.js (canvas + selectable text layer per page) and layers highlights /
// comments on top as page geometry (rects stored as fractions of page size, so
// they re-project at any zoom). Talks to React Native over postMessage.
// A pure string builder (no React).

import type { AnnotationMode } from '@/data/note-annotations';
import type { PdfAnnotations } from '@/types/note';

export type PdfReaderColors = {
  /** Area around the pages (surface). */
  appBg: string;
  /** Page background before its canvas paints (surfaceLowest). */
  pageBg: string;
  /** Comment underline + pin (secondary). */
  accent: string;
  /** Comment fill tint (rgba). */
  commentTint: string;
  /** Loading / error text (onSurfaceVariant). */
  text: string;
  /** Secondary hint text (outline). */
  muted: string;
};

export type PdfReaderDocOptions = {
  /** Raw base64 of the PDF (no data-URI prefix). */
  pdfBase64: string;
  annotations: PdfAnnotations;
  mode: AnnotationMode;
  highlightColor: string;
  colors: PdfReaderColors;
  /** pdf.js library + worker (CDN, pinned). */
  pdfjsUrl: string;
  pdfjsWorkerUrl: string;
};

/** Build the full self-contained PDF Reader page. */
export function buildPdfReaderDocument(opts: PdfReaderDocOptions): string {
  const { colors: c, pdfBase64, annotations, mode, highlightColor } = opts;

  const css = `
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; padding: 0; background: ${c.appBg}; }
    #pages { padding: 12px 12px 160px; }
    .pageWrap {
      position: relative; margin: 0 auto 14px; background: ${c.pageBg};
      border-radius: 6px; overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.10);
    }
    .pageWrap canvas { display: block; }
    .annLayer { position: absolute; left: 0; top: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1; }
    .annLayer .hl { position: absolute; border-radius: 2px; mix-blend-mode: multiply; }
    .annLayer .cm {
      position: absolute; border-radius: 2px 2px 0 0;
      background: ${c.commentTint}; border-bottom: 2px solid ${c.accent};
    }
    .annLayer .pin {
      position: absolute; width: 10px; height: 10px; border-radius: 50%;
      background: ${c.accent}; box-shadow: 0 0 0 2px ${c.pageBg};
    }
    .textLayer {
      position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden;
      opacity: 1; line-height: 1; z-index: 2; forced-color-adjust: none;
    }
    .textLayer span, .textLayer br {
      color: transparent; position: absolute; white-space: pre; cursor: text; transform-origin: 0 0;
    }
    .textLayer ::selection { background: rgba(70,72,212,0.35); }
    #state {
      position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 12px; padding: 32px; text-align: center;
      background: ${c.appBg}; color: ${c.text}; z-index: 10;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #state.hidden { display: none; }
    .spinner {
      width: 34px; height: 34px; border-radius: 50%;
      border: 3px solid ${c.commentTint}; border-top-color: ${c.accent};
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #stateMsg { font-size: 15px; line-height: 1.5; }
    #stateSub { font-size: 13px; line-height: 1.4; color: ${c.muted}; }
  `;

  const script = `
    (function () {
      var STATE = ${JSON.stringify(annotations)};
      if (!STATE.highlights) STATE.highlights = [];
      if (!STATE.comments) STATE.comments = [];
      var mode = ${JSON.stringify(mode)};
      var color = ${JSON.stringify(highlightColor)};
      var pagesEl = document.getElementById('pages');
      var stateEl = document.getElementById('state');
      var layers = {};        // pageNum -> annLayer element
      var wraps = {};         // pageNum -> pageWrap element
      var down = null;

      function post(o) { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
      function genId() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
      function save() {
        // Only committed comments persist — a draft awaiting a body is dropped, and the
        // transient pending flag is stripped so it never reaches SQLite.
        var comments = STATE.comments.filter(function (c) { return !c.pending; }).map(function (c) {
          return { id: c.id, page: c.page, rects: c.rects, quote: c.quote, body: c.body, createdAt: c.createdAt };
        });
        post({ type: 'save', annotations: { highlights: STATE.highlights, comments: comments } });
      }
      function showState(msg, sub, spin) {
        stateEl.classList.remove('hidden');
        stateEl.innerHTML = (spin ? '<div class="spinner"></div>' : '') +
          '<div id="stateMsg">' + msg + '</div>' + (sub ? '<div id="stateSub">' + sub + '</div>' : '');
      }
      function hideState() { stateEl.classList.add('hidden'); }

      // ── base64 → bytes ────────────────────────────────────────────────────
      function toBytes(b64) {
        var bin = atob(b64); var len = bin.length; var out = new Uint8Array(len);
        for (var i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
        return out;
      }

      // ── annotation drawing ────────────────────────────────────────────────
      function place(el, rc, W, H) {
        el.style.left = (rc.x * W) + 'px'; el.style.top = (rc.y * H) + 'px';
        el.style.width = (rc.w * W) + 'px'; el.style.height = (rc.h * H) + 'px';
      }
      function redrawPage(n) {
        var layer = layers[n]; if (!layer) return;
        var W = layer.clientWidth, H = layer.clientHeight;
        layer.innerHTML = '';
        STATE.highlights.forEach(function (h) {
          if (h.page !== n) return;
          h.rects.forEach(function (rc) {
            var d = document.createElement('div'); d.className = 'hl';
            d.style.background = h.color; place(d, rc, W, H); layer.appendChild(d);
          });
        });
        STATE.comments.forEach(function (cm) {
          if (cm.page !== n) return;
          cm.rects.forEach(function (rc) {
            var d = document.createElement('div'); d.className = 'cm'; place(d, rc, W, H); layer.appendChild(d);
          });
          var first = cm.rects[0];
          if (first) {
            var pin = document.createElement('div'); pin.className = 'pin';
            pin.style.left = ((first.x + first.w) * W - 5) + 'px';
            pin.style.top = (first.y * H - 5) + 'px';
            layer.appendChild(pin);
          }
        });
      }

      // ── selection → normalized rects on one page ──────────────────────────
      function pageWrapOf(node) {
        var el = node && node.nodeType === 3 ? node.parentNode : node;
        return el && el.closest ? el.closest('.pageWrap') : null;
      }
      function mergeByLine(rects) {
        var lines = [];
        rects.forEach(function (r) {
          var hit = null;
          for (var i = 0; i < lines.length; i++) {
            if (Math.abs(lines[i].top - r.top) < r.height * 0.6) { hit = lines[i]; break; }
          }
          if (!hit) { lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right }); }
          else {
            hit.top = Math.min(hit.top, r.top); hit.bottom = Math.max(hit.bottom, r.bottom);
            hit.left = Math.min(hit.left, r.left); hit.right = Math.max(hit.right, r.right);
          }
        });
        return lines;
      }
      function selectionInfo() {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
        var range = sel.getRangeAt(0);
        var wrap = pageWrapOf(range.startContainer); if (!wrap) return null;
        var box = wrap.getBoundingClientRect();
        var raw = range.getClientRects(); var keep = [];
        for (var i = 0; i < raw.length; i++) {
          var r = raw[i]; if (r.width < 1 || r.height < 1) continue;
          var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          if (cx < box.left || cx > box.right || cy < box.top || cy > box.bottom) continue;
          keep.push(r);
        }
        if (!keep.length) return null;
        var rects = mergeByLine(keep).map(function (l) {
          return {
            x: (l.left - box.left) / box.width, y: (l.top - box.top) / box.height,
            w: (l.right - l.left) / box.width, h: (l.bottom - l.top) / box.height,
          };
        });
        return { page: parseInt(wrap.getAttribute('data-page'), 10), rects: rects, quote: sel.toString().trim() };
      }
      function clearSelection() { var s = window.getSelection(); if (s) s.removeAllRanges(); }

      // ── create / edit annotations ─────────────────────────────────────────
      function addHighlight() {
        var s = selectionInfo(); if (!s) return;
        STATE.highlights.push({ id: genId(), page: s.page, color: color, rects: s.rects, quote: s.quote, createdAt: new Date().toISOString() });
        clearSelection(); redrawPage(s.page); save();
      }
      function requestComment() {
        var s = selectionInfo(); if (!s) return;
        var cm = { id: genId(), page: s.page, rects: s.rects, quote: s.quote, body: '', createdAt: new Date().toISOString(), pending: true };
        STATE.comments.push(cm); clearSelection(); redrawPage(s.page);
        post({ type: 'requestComment', id: cm.id, quote: cm.quote });
      }
      function findComment(id) { for (var i = 0; i < STATE.comments.length; i++) if (STATE.comments[i].id === id) return STATE.comments[i]; return null; }

      window.__setMode = function (m) { mode = m; };
      window.__setColor = function (col) { color = col; };
      window.__commitComment = function (id, body) {
        var cm = findComment(id); if (!cm) return;
        cm.body = body; cm.pending = false; redrawPage(cm.page); save();
      };
      window.__cancelComment = function (id) {
        var cm = findComment(id); if (!cm) return;
        if (cm.pending) { STATE.comments = STATE.comments.filter(function (x) { return x.id !== id; }); redrawPage(cm.page); }
      };
      window.__deleteComment = function (id) {
        var cm = findComment(id); if (!cm) return;
        STATE.comments = STATE.comments.filter(function (x) { return x.id !== id; }); redrawPage(cm.page); save();
      };

      // ── tap: open a comment, or erase a highlight in highlight mode ────────
      function localPoint(wrap, px, py) {
        var box = wrap.getBoundingClientRect();
        return { x: (px - box.left) / box.width, y: (py - box.top) / box.height };
      }
      function inside(rects, p, pad) {
        for (var i = 0; i < rects.length; i++) {
          var r = rects[i];
          if (p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad) return true;
        }
        return false;
      }
      function hitAt(list, px, py) {
        for (var i = list.length - 1; i >= 0; i--) {
          var a = list[i]; var wrap = wraps[a.page]; if (!wrap) continue;
          var box = wrap.getBoundingClientRect();
          if (px < box.left || px > box.right || py < box.top || py > box.bottom) continue;
          if (inside(a.rects, localPoint(wrap, px, py), 0.006)) return a;
        }
        return null;
      }
      function openComment(cm) { post({ type: 'openComment', id: cm.id, quote: cm.quote, body: cm.body, createdAt: cm.createdAt }); }

      function onRelease(e) {
        setTimeout(function () {
          var sel = window.getSelection();
          var text = sel ? sel.toString() : '';
          if (text && text.trim().length) {
            if (mode === 'highlight') addHighlight();
            else if (mode === 'comment') requestComment();
            return;
          }
          var up = e.changedTouches && e.changedTouches[0];
          var px = up ? up.clientX : e.clientX, py = up ? up.clientY : e.clientY;
          if (down && (Math.abs(px - down.x) > 10 || Math.abs(py - down.y) > 10)) return;
          var cm = hitAt(STATE.comments, px, py);
          if (cm) { openComment(cm); return; }
          if (mode === 'highlight') {
            var h = hitAt(STATE.highlights, px, py);
            if (h) { STATE.highlights = STATE.highlights.filter(function (x) { return x.id !== h.id; }); redrawPage(h.page); save(); }
          }
        }, 10);
      }
      document.addEventListener('touchstart', function (e) {
        var t = e.touches && e.touches[0]; down = t ? { x: t.clientX, y: t.clientY } : null;
      }, { capture: true, passive: true });
      document.addEventListener('touchend', onRelease, { capture: true, passive: true });
      document.addEventListener('mouseup', onRelease, true);

      // ── render the PDF ────────────────────────────────────────────────────
      async function renderPage(pdf, n, availW) {
        var page = await pdf.getPage(n);
        var base = page.getViewport({ scale: 1 });
        var scale = availW / base.width;
        var viewport = page.getViewport({ scale: scale });
        var wrap = document.createElement('div'); wrap.className = 'pageWrap';
        wrap.setAttribute('data-page', String(n));
        wrap.style.width = Math.floor(viewport.width) + 'px';
        wrap.style.height = Math.floor(viewport.height) + 'px';
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        var textLayer = document.createElement('div'); textLayer.className = 'textLayer';
        textLayer.style.width = Math.floor(viewport.width) + 'px';
        textLayer.style.height = Math.floor(viewport.height) + 'px';
        textLayer.style.setProperty('--scale-factor', String(scale));
        var annLayer = document.createElement('div'); annLayer.className = 'annLayer';
        wrap.appendChild(canvas); wrap.appendChild(annLayer); wrap.appendChild(textLayer);
        pagesEl.appendChild(wrap);
        wraps[n] = wrap; layers[n] = annLayer;

        var transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;
        await page.render({ canvasContext: ctx, viewport: viewport, transform: transform }).promise;
        try {
          var textContent = await page.getTextContent();
          await window.pdfjsLib.renderTextLayer({
            textContentSource: textContent, textContent: textContent, container: textLayer, viewport: viewport, textDivs: [],
          }).promise;
        } catch (te) { /* selection layer is best-effort */ }
        redrawPage(n);
      }

      async function run() {
        try {
          if (!window.pdfjsLib) throw new Error('lib');
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = ${JSON.stringify(opts.pdfjsWorkerUrl)};
          var task = window.pdfjsLib.getDocument({ data: toBytes(window.__PDF_B64) });
          var pdf = await task.promise;
          var availW = Math.max(240, pagesEl.clientWidth - 24);
          for (var n = 1; n <= pdf.numPages; n++) {
            await renderPage(pdf, n, availW);
            if (n === 1) { hideState(); post({ type: 'ready' }); }
          }
        } catch (err) {
          var offline = String(err && err.message) === 'lib';
          showState(
            offline ? 'Could not load the PDF viewer' : 'Could not open this PDF',
            offline ? 'The viewer needs internet the first time. Check your connection and try again.'
                    : 'The file may be missing or damaged.',
            false
          );
          post({ type: 'error', message: String(err && err.message || err) });
        }
      }

      var started = false;
      function boot() { if (started) return; started = true; run(); }
      window.__onPdfjs = boot;            // fires from the <script onload>
      showState('Rendering PDF…', '', true);
      if (window.pdfjsLib) boot();
      // Offline / blocked CDN never fires onload — surface the error instead of hanging.
      setTimeout(function () { if (!started) boot(); }, 8000);
    })();
  `;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<style>${css}</style>
</head>
<body>
<div id="pages"></div>
<div id="state"></div>
<script>window.__PDF_B64 = "${pdfBase64}";</script>
<script src="${opts.pdfjsUrl}" onload="window.__onPdfjs && window.__onPdfjs()" onerror="window.__pdfjsFailed=true"></script>
<script>${script}</script>
</body>
</html>`;
}
