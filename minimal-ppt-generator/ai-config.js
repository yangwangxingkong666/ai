/* =============================================
   极简 PPT 生成器 — AI 配置与生成
   默认兼容 DeepSeek API（也支持所有 OpenAI 兼容接口）
   自动生成 10 页结构化 Markdown PPT 文案
   ============================================= */

/**
 * 调用 DeepSeek / OpenAI 兼容 API 生成 Markdown PPT 文案
 * 默认使用 DeepSeek Chat API（https://api.deepseek.com/v1）
 * 也可切换为任意兼容 OpenAI Chat Completions 格式的 API
 */
async function generateWithAI() {
  var endpoint = document.getElementById('aiEndpoint').value.trim();
  var apiKey = document.getElementById('aiKey').value.trim();
  var model = document.getElementById('aiModel').value.trim();
  var prompt = document.getElementById('aiPrompt').value.trim();

  // 输入校验
  if (!endpoint) {
    alert('请输入 API 端点地址。');
    return;
  }
  if (!apiKey) {
    alert('请输入 API Key。');
    return;
  }
  if (!prompt) {
    alert('请输入 PPT 主题或关键词。');
    return;
  }

  var statusEl = document.getElementById('aiStatus');
  var btnText = document.getElementById('aiBtnText');
  var btn = document.getElementById('btnAIGenerate');

  statusEl.style.display = '';
  statusEl.textContent = '\u6B63\u5728\u8C03\u7528 AI \u751F\u6210\u6587\u6848\u2026\u2026';
  btn.disabled = true;
  btnText.textContent = '\u751F\u6210\u4E2D\u2026';

  var systemPrompt = '\u4F60\u662F\u4E00\u4F4D\u4E13\u4E1A\u7684\u6F14\u793A\u6587\u7A3F\u7B56\u5212\u5E08\uFF0C\u8BF7\u7528\u4E2D\u6587\u751F\u6210\u4E00\u4EFD\u7ED3\u6784\u5316\u3001\u6781\u7B80\u98CE\u683C\u7684\u6F14\u793A\u6587\u7A3F\u3002\n\n' +
    '\u4E25\u683C\u9075\u5FAA\u4EE5\u4E0B\u89C4\u5219\uFF1A\n' +
    '1. \u7CBE\u786E\u8F93\u51FA 10 \u9875\u5E7B\u706F\u7247\uFF0C\u6BCF\u9875\u4E4B\u95F4\u7528\u72EC\u7ACB\u4E00\u884C\u7684 "---" \u5206\u9694\u3002\n' +
    '2. \u7B2C1\u9875\u5FC5\u987B\u662F\u5C01\u9762\uFF1A"# [\u6807\u9898]" \u6362\u884C\u540E "## [\u526F\u6807\u9898 / \u6F14\u8BB2\u4EBA / \u65E5\u671F]"\u3002\n' +
    '3. \u7B2C2\u9875\u5FC5\u987B\u662F\u76EE\u5F55\u9875\uFF1A"# \u76EE\u5F55" \u7136\u540E\u7528 "- " \u5217\u51FA 8 \u4E2A\u4E3B\u8981\u7AE0\u8282\u3002\n' +
    '4. \u7B2C3-9\u9875\u662F\u5185\u5BB9\u9875\uFF0C\u6BCF\u9875\u5FC5\u987B\u6709 "## [\u7AE0\u8282\u6807\u9898]" \u548C 3-5 \u6761 "- " \u8981\u70B9\u5217\u8868\uFF0C\u53EF\u7528 **\u7C97\u4F53** \u5F3A\u8C03\u5173\u952E\u8BCD\u3002\n' +
    '5. \u7B2C10\u9875\u662F\u7ED3\u675F\u9875\uFF1A"# \u8C22\u8C22\u89C2\u770B" \u548C "## [\u884C\u52A8\u53EC\u553E\u6216\u7ED3\u675F\u8BED]"\u3002\n' +
    '6. \u4F7F\u7528\u4F18\u96C5\u3001\u4E13\u4E1A\u7684\u4E2D\u6587\uFF0C\u6BCF\u9875\u4FE1\u606F\u7CBE\u7B80\uFF083-5 \u4E2A\u8981\u70B9\uFF09\u3002\n' +
    '7. \u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u89E3\u91CA\u6216\u989D\u5916\u8BF4\u660E\uFF0C\u53EA\u8F93\u51FA Markdown \u6587\u6848\u672C\u8EAB\u3002\n' +
    '8. \u5185\u5BB9\u5FC5\u987B\u7D27\u6263\u7528\u6237\u6307\u5B9A\u7684\u4E3B\u9898\u3002';

  var userPrompt = '\u8BF7\u4E3A\u4EE5\u4E0B\u4E3B\u9898\u751F\u6210\u4E00\u4EFD\u6781\u7B80\u98CE\u683C\u7684\u6F14\u793A\u6587\u7A3F\uFF1A' + prompt;

  try {
    var response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      var errText = '';
      try {
        var errData = await response.json();
        errText = errData.error ? errData.error.message : JSON.stringify(errData);
      } catch (e) {
        errText = response.statusText;
      }
      throw new Error('API \u9519\u8BEF (' + response.status + '): ' + errText);
    }

    var data = await response.json();
    var content = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';

    if (!content || content.trim() === '') {
      throw new Error('AI \u8FD4\u56DE\u4E86\u7A7A\u5185\u5BB9\uFF0C\u8BF7\u91CD\u8BD5\u3002');
    }

    // 清理可能的多余格式化（去掉首尾的代码块标记）
    content = content.trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```[a-zA-Z]*\n?/, '');
      content = content.replace(/\n?```$/, '');
    }

    // 回填到编辑器
    markdownInput.value = content;
    renderAllSlides();

    statusEl.textContent = '\u2714 \u6210\u529F\u751F\u6210 ' + slides.length + ' \u5F20\u5E7B\u706F\u7247\uFF01';
    statusEl.style.color = 'var(--accent-color)';
    btnText.textContent = '\u751F\u6210\u5B8C\u6210';

    // 3 秒后关闭弹窗
    setTimeout(function () {
      closeAIModal();
      statusEl.style.display = 'none';
      statusEl.style.color = '';
      btnText.textContent = '\u751F\u6210 PPT \u6587\u6848';
      btn.disabled = false;
    }, 2000);

  } catch (error) {
    console.error('AI \u751F\u6210\u5931\u8D25:', error);
    statusEl.textContent = '\u2716 \u751F\u6210\u5931\u8D25\uFF1A' + error.message;
    statusEl.style.color = '#ef4444';
    btnText.textContent = '\u751F\u6210 PPT \u6587\u6848';
    btn.disabled = false;
  }
}