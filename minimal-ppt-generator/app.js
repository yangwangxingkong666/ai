/* =============================================
   极简 PPT 生成器 — 核心引擎
   Markdown 解析 + 预览渲染 + PPTX 导出
   ============================================= */

// ---------- 全局状态 ----------
var slides = [];
var currentSlideIndex = 0;
var currentTheme = 'minimal-white';

// ---------- 防抖 ----------
function debounce(fn, delay) {
  delay = delay || 150;
  var timer;
  return function () {
    var ctx = this;
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

// ---------- DOM 引用 ----------
var markdownInput = document.getElementById('markdownInput');
var slideTitle = document.getElementById('slideTitle');
var slideSubtitle = document.getElementById('slideSubtitle');
var slideBody = document.getElementById('slideBody');
var slideContent = document.getElementById('slideContent');
var slidePageNumber = document.getElementById('slidePageNumber');
var emptyState = document.getElementById('emptyState');
var slideCountEl = document.getElementById('slideCount');
var slideIndicator = document.getElementById('slideIndicator');
var btnPrev = document.getElementById('btnPrev');
var btnNext = document.getElementById('btnNext');
var loadingIndicator = document.getElementById('loadingIndicator');
var aiModal = document.getElementById('aiModal');

// ---------- HTML 转义 ----------
function escapeHtml(str) {
  return ('' + str)
    .replace(/&/g, '&' + 'amp;')
    .replace(/</g, '&' + 'lt;')
    .replace(/>/g, '&' + 'gt;')
    .replace(/"/g, '&' + 'quot;');
}

// ---------- Markdown 行内解析 ----------
function parseInline(text) {
  if (!text) return '';

  var html = text;

  var codeSpans = [];
  html = html.replace(/`([^`]+)`/g, function (_, code) {
    codeSpans.push('<code>' + escapeHtml(code) + '</code>');
    return '\u0000C' + (codeSpans.length - 1) + '\u0000';
  });

  html = html.replace(/</g, '&' + 'lt;').replace(/>/g, '&' + 'gt;');
  html = html.replace(/\u0000C(\d+)\u0000/g, function (_, i) { return codeSpans[parseInt(i)]; });

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:60%;border-radius:8px;margin:0.5rem 0;">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--accent-color);">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  return html;
}

// ---------- 单页解析 ----------
function parseSingleSlide(md) {
  var lines = md.split('\n');
  var result = { title: '', subtitle: '', bodyLines: [], isCover: false };
  var inCodeBlock = false;
  var codeLines = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.trim().substring(0, 3) === '```') {
      if (inCodeBlock) {
        result.bodyLines.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }
    if (line.trim() === '') continue;

    var h1m = line.match(/^#\s+(.*)$/);
    if (h1m) {
      if (!result.title) { result.title = parseInline(h1m[1]); }
      else { result.bodyLines.push('<h2 style="font-size:1.8rem;font-weight:500;margin-top:0.5rem;color:var(--text-main);">' + parseInline(h1m[1]) + '</h2>'); }
      continue;
    }
    var h2m = line.match(/^##\s+(.*)$/);
    if (h2m) {
      if (!result.title) { result.title = parseInline(h2m[1]); }
      else if (!result.subtitle) { result.subtitle = parseInline(h2m[1]); }
      else { result.bodyLines.push('<h3 style="font-size:1.4rem;font-weight:500;margin-top:0.5rem;color:var(--text-secondary);">' + parseInline(h2m[1]) + '</h3>'); }
      continue;
    }
    var h3m = line.match(/^###\s+(.*)$/);
    if (h3m) {
      result.bodyLines.push('<h3 style="font-size:1.4rem;font-weight:500;margin-top:0.5rem;color:var(--text-secondary);">' + parseInline(h3m[1]) + '</h3>');
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      result.bodyLines.push('<hr>');
      continue;
    }
    var ulm = line.match(/^(\s*)[-*+]\s+(.*)$/);
    if (ulm) { result.bodyLines.push('<li>' + parseInline(ulm[2]) + '</li>'); continue; }
    var olm = line.match(/^(\s*)\d+\.\s+(.*)$/);
    if (olm) { result.bodyLines.push('<li data-ol="1">' + parseInline(olm[2]) + '</li>'); continue; }
    if (line.trim().charAt(0) === '>') {
      result.bodyLines.push('<blockquote>' + parseInline(line.trim().replace(/^>\s?/, '')) + '</blockquote>');
      continue;
    }
    result.bodyLines.push('<p>' + parseInline(line) + '</p>');
  }

  if (inCodeBlock && codeLines.length > 0) {
    result.bodyLines.push('<pre><code>' + escapeHtml(codeLines.join('\n')) + '</code></pre>');
  }

  if (result.title && result.bodyLines.length <= 3) result.isCover = true;
  return result;
}

function parseAllSlides(raw) {
  var blocks = raw.split(/^---+$/m).filter(function (b) { return b.trim() !== ''; });
  return blocks.map(function (block) { return parseSingleSlide(block.trim()); });
}

// ---------- 渲染单页预览 ----------
function renderSlideToPreview(slideData, index, total) {
  slideContent.classList.add('slide-exit');

  setTimeout(function () {
    if (slideData.title) {
      slideTitle.innerHTML = slideData.title;
      slideTitle.style.display = '';
    } else {
      slideTitle.innerHTML = '';
      slideTitle.style.display = 'none';
    }

    if (slideData.subtitle) {
      slideSubtitle.innerHTML = slideData.subtitle;
      slideSubtitle.style.display = '';
    } else {
      slideSubtitle.innerHTML = '';
      slideSubtitle.style.display = 'none';
    }

    var bodyHTML = '';
    var parts = slideData.bodyLines;
    var inUL = false, inOL = false;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.indexOf('<li>') === 0 && p.indexOf('data-ol') === -1) {
        if (!inUL) { if (inOL) { bodyHTML += '</ol>'; inOL = false; } bodyHTML += '<ul>'; inUL = true; }
        bodyHTML += p;
      } else if (p.indexOf('<li data-ol=') === 0) {
        if (!inOL) { if (inUL) { bodyHTML += '</ul>'; inUL = false; } bodyHTML += '<ol>'; inOL = true; }
        bodyHTML += p.replace(' data-ol="1"', '');
      } else {
        if (inUL) { bodyHTML += '</ul>'; inUL = false; }
        if (inOL) { bodyHTML += '</ol>'; inOL = false; }
        bodyHTML += p;
      }
    }
    if (inUL) bodyHTML += '</ul>';
    if (inOL) bodyHTML += '</ol>';
    slideBody.innerHTML = bodyHTML;

    slidePageNumber.textContent = (index + 1) + ' / ' + total;
    slidePageNumber.style.display = '';
    slideContent.style.display = '';
    emptyState.style.display = 'none';

    if (slideData.isCover) {
      slideContent.style.justifyContent = 'center';
      slideContent.style.alignItems = 'center';
      slideContent.style.textAlign = 'center';
      slideTitle.style.fontSize = '3.5rem';
    } else {
      slideContent.style.justifyContent = '';
      slideContent.style.alignItems = '';
      slideContent.style.textAlign = '';
      slideTitle.style.fontSize = '2.8rem';
    }

    slideContent.classList.remove('slide-exit');
  }, 150);
}

// ---------- 渲染所有幻灯片 ----------
function renderAllSlides() {
  loadingIndicator.style.display = 'flex';

  var raw = markdownInput.value;
  slides = parseAllSlides(raw);

  if (slides.length === 0) {
    slideContent.style.display = 'none';
    slidePageNumber.style.display = 'none';
    emptyState.style.display = 'flex';
    slideCountEl.textContent = '\u5171 0 \u5F20\u5E7B\u706F\u7247';
    slideIndicator.textContent = '\u2014';
    btnPrev.disabled = true;
    btnNext.disabled = true;
    loadingIndicator.style.display = 'none';
    return;
  }

  slideCountEl.textContent = '\u5171 ' + slides.length + ' \u5F20\u5E7B\u706F\u7247';
  if (currentSlideIndex >= slides.length) currentSlideIndex = Math.max(0, slides.length - 1);
  goToSlide(currentSlideIndex);
  loadingIndicator.style.display = 'none';
}

// ---------- 导航 ----------
function goToSlide(index) {
  if (slides.length === 0) return;
  if (index < 0) index = 0;
  if (index >= slides.length) index = slides.length - 1;
  currentSlideIndex = index;
  renderSlideToPreview(slides[index], index, slides.length);
  updateSlideIndicator();
  updateButtonStates();
}
function nextSlide() { if (currentSlideIndex < slides.length - 1) goToSlide(currentSlideIndex + 1); }
function prevSlide() { if (currentSlideIndex > 0) goToSlide(currentSlideIndex - 1); }
function updateSlideIndicator() {
  if (slides.length === 0) { slideIndicator.textContent = '\u2014'; return; }
  slideIndicator.textContent = (currentSlideIndex + 1) + ' / ' + slides.length;
}
function updateButtonStates() {
  btnPrev.disabled = (currentSlideIndex <= 0);
  btnNext.disabled = (currentSlideIndex >= slides.length - 1);
}

// ---------- 输入处理（150ms 防抖） ----------
var debouncedRender = debounce(renderAllSlides, 150);
function handleInput() { debouncedRender(); }

// ---------- 键盘导航 ----------
document.addEventListener('keydown', function (e) {
  if (document.activeElement === markdownInput) return;
  if (aiModal.style.display === 'flex') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
});

// ---------- 主题切换 ----------
function switchTheme(themeName) {
  currentTheme = themeName;
  document.body.className = 'font-sans antialiased transition-colors duration-300 theme-' + themeName;
  var btns = document.querySelectorAll('.theme-btn');
  btns.forEach(function (btn) {
    if (btn.getAttribute('data-theme') === themeName) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  if (slides.length > 0) {
    renderSlideToPreview(slides[currentSlideIndex], currentSlideIndex, slides.length);
  }
}

// ---------- PPTX 导出 ----------
function exportToRealPPTX() {
  if (slides.length === 0) { alert('\u8BF7\u5148\u8F93\u5165 Markdown \u5185\u5BB9\uFF0C\u518D\u5BFC\u51FA\u3002'); return; }

  var style = getComputedStyle(document.body);
  var bgColor = style.getPropertyValue('--slide-bg').trim() || '#ffffff';
  var textColor = style.getPropertyValue('--text-main').trim() || '#111827';
  var accentColor = style.getPropertyValue('--accent-color').trim() || '#4F46E5';
  var secondaryColor = style.getPropertyValue('--text-secondary').trim() || '#6b7280';
  var bodyColor = style.getPropertyValue('--text-body').trim() || '#4b5563';

  var pres = new PptxGenJS();
  pres.defineLayout({ name: 'CUSTOM_16x9', width: '13.333', height: '7.5' });
  pres.layout = 'CUSTOM_16x9';

  slides.forEach(function (sd, idx) {
    var s = pres.addSlide();
    s.background = { color: bgColor };
    s.addShape(pres.ShapeType.rect, { x: 0.8, y: 0.6, w: 0.8, h: 0.02, fill: { color: accentColor } });

    if (sd.isCover) {
      if (sd.title) s.addText(stripTags(sd.title), { x: 0.8, y: 2.0, w: 11.7, h: 2.0, fontSize: 44, fontFace: 'Georgia', bold: true, color: textColor, align: 'center', valign: 'middle' });
      if (sd.subtitle) s.addText(stripTags(sd.subtitle), { x: 0.8, y: 4.2, w: 11.7, h: 1.0, fontSize: 20, fontFace: 'Arial', color: secondaryColor, align: 'center', valign: 'middle' });
    } else {
      if (sd.title) s.addText(stripTags(sd.title), { x: 0.8, y: 0.9, w: 11.7, h: 1.2, fontSize: 36, fontFace: 'Georgia', bold: true, color: textColor, align: 'left', valign: 'top' });
      if (sd.subtitle) s.addText(stripTags(sd.subtitle), { x: 0.8, y: 2.2, w: 11.7, h: 0.8, fontSize: 18, fontFace: 'Arial', color: secondaryColor, align: 'left', valign: 'top' });
      var items = extractTextFromBody(sd.bodyLines);
      var bodyY = sd.subtitle ? 3.3 : 2.5;
      if (items.length > 0) {
        s.addText(items.map(function (it) { return it.text; }), { x: 0.8, y: bodyY, w: 11.7, h: 4.2, fontSize: 16, fontFace: 'Arial', color: bodyColor, bullet: true, align: 'left', valign: 'top', lineSpacing: 32 });
      }
    }
    s.addText((idx + 1) + ' / ' + slides.length, { x: 11.0, y: 7.0, w: 2.0, h: 0.3, fontSize: 9, fontFace: 'Arial', color: secondaryColor, align: 'right' });
  });

  pres.writeFile({ fileName: 'Minimal-Presentation.pptx' });
}

function stripTags(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent || d.innerText || ''; }
function extractTextFromBody(lines) {
  var items = [];
  lines.forEach(function (l) { var t = stripTags(l).trim(); if (t) items.push({ text: t }); });
  return items;
}

// ---------- AI 弹窗 ----------
function openAIModal() { aiModal.style.display = 'flex'; }
function closeAIModal() { aiModal.style.display = 'none'; }

// ---------- 加载示例 ----------
function loadSample() {
  markdownInput.value =
    '# \u6781\u7B80\u8BBE\u8BA1\u7684\u827A\u672F\n## Less is More\n> \u81F3\u7E41\u5F52\u4E8E\u81F3\u7B80\u3002\n\n---\n# \u76EE\u5F55\n\n- \u4EC0\u4E48\u662F\u6781\u7B80\u8BBE\u8BA1\n- \u6838\u5FC3\u7406\u5FF5\u4E0E\u539F\u5219\n- \u7559\u767D\u7684\u529B\u91CF\n- \u5B57\u4F53\u6392\u5370\u5B66\n- \u8272\u5F69\u514B\u5236\n- \u603B\u7ED3\n\n---\n## \u4EC0\u4E48\u662F\u6781\u7B80\u8BBE\u8BA1\n\n\u6781\u7B80\u8BBE\u8BA1\uFF08Minimalism\uFF09\u5174\u8D77\u4E8E 20 \u4E16\u7EAA 60 \u5E74\u4EE3\u3002\n\n\u5176\u6838\u5FC3\u54F2\u5B66\u662F\uFF1A\n\n- **\u53BB\u9664\u591A\u4F59** \u2014 \u53EA\u4FDD\u7559\u5FC5\u8981\u5143\u7D20\n- **\u5185\u5BB9\u4F18\u5148** \u2014 \u8BA9\u4FE1\u606F\u6210\u4E3A\u7126\u70B9\n- **\u529F\u80FD\u81F3\u4E0A** \u2014 \u5F62\u5F0F\u670D\u52A1\u4E8E\u529F\u80FD\n\n> \u6781\u7B80\u4E0D\u662F\u8D2B\u4E4F\uFF0C\u800C\u662F **\u7CBE\u51C6**\u3002\n\n---\n## \u56DB\u5927\u6838\u5FC3\u539F\u5219\n\n1. **\u514B\u5236** \u2014 \u6BCF\u4E2A\u5143\u7D20\u90FD\u9700\u6709\u5B58\u5728\u7406\u7531\n2. **\u7559\u767D** \u2014 \u7A7A\u767D\u662F\u547C\u5438\u7684\u7A7A\u95F4\n3. **\u5BF9\u6BD4** \u2014 \u5B57\u53F7\u3001\u7C97\u7EC6\u3001\u660E\u6697\u7684\u5C42\u6B21\n4. **\u4E00\u81F4** \u2014 \u7EDF\u4E00\u95F4\u8DDD\u3001\u8272\u5F69\u3001\u5B57\u4F53\n\n---\n## \u7559\u767D\u7684\u529B\u91CF\n\n\u9002\u5F53\u7684\u5927\u9762\u79EF\u7559\u767D\u80FD\u591F\uFF1A\n\n- \u5F15\u5BFC\u89C6\u7EBF\u805A\u7126\u5173\u952E\u5185\u5BB9\n- \u964D\u4F4E\u4FE1\u606F\u5BC6\u5EA6\u7684\u538B\u8FEB\u611F\n- \u8425\u9020\u9AD8\u7EA7\u3001\u6C89\u7A33\u7684\u54C1\u724C\u6C14\u8D28\n- \u63D0\u5347\u9605\u8BFB\u8212\u9002\u5EA6\u548C\u7406\u89E3\u6548\u7387\n\n---\n## \u5B57\u4F53\u6392\u5370\u5B66\n\n- **\u6807\u9898**\uFF1A\u6709\u886C\u7EBF\u4F53\u6216\u4F18\u96C5\u65E0\u886C\u7EBF\u4F53\n- **\u6B63\u6587**\uFF1A\u9AD8\u53EF\u8BFB\u6027\u7684\u65E0\u886C\u7EBF\u4F53\n- **\u5B57\u53F7\u5BF9\u6BD4**\uFF1A\u6807\u9898/\u6B63\u6587 \u2248 3:1\n\n---\n## \u8272\u5F69\u514B\u5236\n\n> \u9ED1\u767D\u7070\u662F\u6C38\u6052\u4E3B\u89D2\uFF0C\u70B9\u7F00\u8272\u662F\u77AC\u95F4\u60CA\u559C\u3002\n\n- \u4E3B\u8272\uFF1A\u9ED1/\u767D/\u7070\n- \u70B9\u7F00\u8272\uFF1A**\u53EA\u7528\u4E00\u79CD**\n- \u907F\u514D\u8D85\u8FC7 3 \u79CD\u4E3B\u8981\u989C\u8272\n\n---\n## \u5B9E\u8DF5\u5EFA\u8BAE\n\n1. \u5148\u5199\u5185\u5BB9\uFF0C\u518D\u505A\u51CF\u6CD5\n2. \u6BCF\u9875\u53EA\u4F20\u8FBE **\u4E00\u4E2A\u6838\u5FC3\u4FE1\u606F**\n3. \u56FE\u7247\u8981\u5927\u3001\u6587\u5B57\u8981\u5C11\u3001\u7559\u767D\u8981\u591A\n4. \u5BF9\u9F50\u662F\u4E00\u5207\u7684\u57FA\u7840\n5. \u52A8\u753B\u8981\u5FAE\u5999\uFF0C\u4E0D\u53EF\u55A7\u5BBE\u593A\u4E3B\n\n---\n# \u8C22\u8C22\u89C2\u770B\n## \u5F00\u59CB\u521B\u5EFA\u4F60\u7684\u6781\u7B80 PPT \u5427';
  renderAllSlides();
}

// ---------- 初始化 ----------
function init() {
  lucide.createIcons();
  switchTheme('minimal-white');

  // 点击弹窗背景关闭
  aiModal.addEventListener('click', function (e) {
    if (e.target === aiModal) closeAIModal();
  });

  loadSample();
}

document.addEventListener('DOMContentLoaded', init);