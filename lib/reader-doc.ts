// The HTML document for the Note Reader's WebView: read + annotate (highlight /
// margin comment). In-page selection logic talks to RN over postMessage;
// highlights bake into the DOM as `<mark class="hl">`, comments as `mark.cm`.
// A pure string builder (no React).

import type { AnnotationMode } from '@/data/note-annotations';

export type ReaderDocColors = {
  /** Page background (surfaceLowest). */
  surface: string;
  /** Body text (onSurfaceVariant). */
  ink: string;
  /** Headings (onSurface). */
  heading: string;
  /** Comment-anchor underline (secondary). */
  accent: string;
  /** Comment-anchor / selection tint (secondaryFixed-ish). */
  accentSoft: string;
  /** Quote left-bar + code well border. */
  line: string;
  /** Muted rule / code background. */
  well: string;
};

export type ReaderDocOptions = {
  title: string;
  /** The note HTML (may already carry `<mark>` highlights/comment anchors). */
  html: string;
  colors: ReaderDocColors;
  mode: AnnotationMode;
  /** Active highlight colour when in highlight mode. */
  highlightColor: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Build the full self-contained reader page. */
export function buildReaderDocument(opts: ReaderDocOptions): string {
  const { colors: c, title, html, mode, highlightColor } = opts;

  const css = `
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; padding: 0; }
    body {
      background: ${c.surface};
      color: ${c.ink};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.65;
      padding: 8px 20px 160px;
      -webkit-text-size-adjust: 100%;
      touch-action: manipulation;
      -webkit-user-select: text;
      user-select: text;
    }
    .chapter { color: ${c.heading}; font-size: 26px; line-height: 1.25; font-weight: 800; margin: 4px 0 18px; }
    #content h1 { color: ${c.heading}; font-size: 23px; line-height: 1.3; font-weight: 800; margin: 20px 0 10px; }
    #content h2 { color: ${c.heading}; font-size: 20px; line-height: 1.3; font-weight: 700; margin: 18px 0 8px; }
    #content h3 { color: ${c.heading}; font-size: 17px; line-height: 1.35; font-weight: 700; margin: 16px 0 8px; }
    #content p { margin: 0 0 14px; }
    #content ul, #content ol { margin: 0 0 14px; padding-left: 22px; }
    #content li { margin: 0 0 6px; }
    #content blockquote {
      margin: 0 0 14px; padding: 8px 14px; border-left: 3px solid ${c.line};
      background: ${c.accentSoft}; border-radius: 8px; font-style: italic;
    }
    #content pre {
      margin: 0 0 14px; padding: 12px; background: ${c.well}; border: 1px solid ${c.line};
      border-radius: 10px; overflow-x: auto; font-size: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #content code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    #content img { display: block; max-width: 100%; height: auto; border-radius: 12px; margin: 14px 0; }
    #content a { color: ${c.accent}; }
    mark { color: inherit; border-radius: 3px; padding: 0 1px; background: transparent; }
    mark.hl { padding: 1px 1px; }
    mark.cm {
      background: ${c.accentSoft}; border-bottom: 2px solid ${c.accent};
      border-radius: 3px 3px 0 0; cursor: pointer;
    }
    ::selection { background: ${c.accentSoft}; }
    #empty { color: ${c.ink}; opacity: 0.7; }
  `;

  const body = html && html.trim().length ? html : '<p id="empty">This note has no content yet.</p>';

  // In-page annotation engine. Communicates via window.ReactNativeWebView.
  const script = `
    (function () {
      var content = document.getElementById('content');
      var mode = ${JSON.stringify(mode)};
      var color = ${JSON.stringify(highlightColor)};
      var down = null;

      function post(obj) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(obj));
      }
      function currentHtml() { return content.innerHTML; }
      function postChange() { post({ type: 'change', html: currentHtml() }); }
      function genId() {
        return 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
      }

      // Wrap the live selection range in a fresh mark, tolerating selections that
      // cross element boundaries (surroundContents throws on those).
      function wrapSelection(mark) {
        var sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
        var range = sel.getRangeAt(0);
        if (!content.contains(range.commonAncestorContainer)) return false;
        try {
          range.surroundContents(mark);
        } catch (e) {
          var frag = range.extractContents();
          mark.appendChild(frag);
          range.insertNode(mark);
        }
        sel.removeAllRanges();
        return true;
      }

      function unwrap(el) {
        var parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        parent.normalize();
      }

      function applyHighlight() {
        var mark = document.createElement('mark');
        mark.className = 'hl';
        mark.setAttribute('data-color', color);
        mark.style.background = color;
        if (wrapSelection(mark)) postChange();
      }

      function applyComment() {
        var sel = window.getSelection();
        var quote = sel ? sel.toString() : '';
        var cid = genId();
        var mark = document.createElement('mark');
        mark.className = 'cm';
        mark.setAttribute('data-cid', cid);
        if (wrapSelection(mark)) {
          // RN opens the comment editor; on save it keeps this html, on cancel it
          // calls __removeMark(cid). We send html now so a save can persist it.
          post({ type: 'requestComment', cid: cid, quote: quote, html: currentHtml() });
        }
      }

      // Called by React Native (webviewRef.injectJavaScript).
      window.__setMode = function (m) { mode = m; document.body.setAttribute('data-mode', m); };
      window.__setColor = function (col) { color = col; };
      window.__removeMark = function (cid) {
        var el = content.querySelector('mark[data-cid="' + cid + '"]');
        if (el) { unwrap(el); postChange(); }
      };
      // Undo/redo restores a previous DOM snapshot in place (no page reload, so
      // scroll and the delegated tap handlers on document survive). RN already
      // holds the matching comment list, so this does NOT post a change back.
      window.__setHtml = function (html) { content.innerHTML = html; };

      function closestMark(node, selector) {
        var el = node && node.nodeType === 3 ? node.parentNode : node;
        return el && el.closest ? el.closest(selector) : null;
      }

      // Passive listeners so the browser never waits on our handlers before
      // scrolling — non-passive touch listeners are a classic cause of scroll lag.
      document.addEventListener('touchstart', function (e) {
        var t = e.touches && e.touches[0];
        down = t ? { x: t.clientX, y: t.clientY } : null;
      }, { capture: true, passive: true });

      function onRelease(e) {
        setTimeout(function () {
          var sel = window.getSelection();
          var text = sel ? sel.toString() : '';
          if (text && text.trim().length) {
            if (mode === 'highlight') applyHighlight();
            else if (mode === 'comment') applyComment();
            // view mode: leave the selection for normal copy.
            return;
          }
          // A collapsed selection = a tap. Ignore taps that were really scrolls.
          if (down && e.changedTouches && e.changedTouches[0]) {
            var up = e.changedTouches[0];
            if (Math.abs(up.clientX - down.x) > 10 || Math.abs(up.clientY - down.y) > 10) return;
          }
          var target = e.target;
          var cm = closestMark(target, 'mark[data-cid]');
          if (cm) { post({ type: 'openComment', cid: cm.getAttribute('data-cid') }); return; }
          if (mode === 'highlight') {
            var hl = closestMark(target, 'mark.hl');
            if (hl) { unwrap(hl); postChange(); }
          }
        }, 10);
      }

      document.addEventListener('touchend', onRelease, { capture: true, passive: true });
      document.addEventListener('mouseup', onRelease, true);
      document.body.setAttribute('data-mode', mode);
      post({ type: 'ready' });
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
<h1 class="chapter">${escapeHtml(title)}</h1>
<div id="content">${body}</div>
<script>${script}</script>
</body>
</html>`;
}
