let isUpdating = false;

async function updateStyles() {
  if (isUpdating) return;
  isUpdating = true;

  const editor = document.getElementById('editor');
  const html = editor.innerText;
  const editorStatus = document.getElementById('editor-status');
  const cssStatus = document.getElementById('css-status');
  const cssOutput = document.getElementById('css-output');
  const preview = document.getElementById('preview');

  editorStatus.textContent = 'Generating CSS...';
  editorStatus.className = 'status loading';
  cssStatus.textContent = 'Processing...';
  cssStatus.className = 'status loading';

  try {
    const response = await fetch('/api/generate-css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Apply the CSS
    document.getElementById('generated-styles').textContent = data.css;

    // Display the CSS
    cssOutput.textContent = data.css || '/* No CSS generated - no Tailwind classes found */';

    // Render the preview
    preview.innerHTML = html;

    // Update stats
    const cssSize = new Blob([data.css]).size;
    let displaySize;
    if (cssSize < 1024) {
      displaySize = cssSize + ' bytes';
    } else if (cssSize < 1024 * 1024) {
      displaySize = (cssSize / 1024).toFixed(1) + ' KB';
    } else {
      displaySize = (cssSize / (1024 * 1024)).toFixed(2) + ' MB';
    }
    document.getElementById('css-size').textContent = displaySize;

    const classCount = (data.css.match(/\.[\w-]+/g) || []).length;
    document.getElementById('class-count').textContent = classCount + ' classes';

    // Update status
    editorStatus.textContent = 'Ready';
    editorStatus.className = 'status success';
    cssStatus.textContent = 'Generated successfully';
    cssStatus.className = 'status success';

  } catch (err) {
    console.error('Failed to generate CSS:', err);
    editorStatus.textContent = 'Error: ' + err.message;
    editorStatus.className = 'status error';
    cssStatus.textContent = 'Generation failed';
    cssStatus.className = 'status error';
    cssOutput.textContent = '/* Error generating CSS */';
    preview.innerHTML = '<p style="color: red;">Error rendering preview</p>';
  } finally {
    isUpdating = false;
  }
}

function highlightEditor() {
  const editor = document.getElementById('editor');
  if (window.Prism && Prism.highlightElement) {
    Prism.highlightElement(editor);
  }
}

function formatEditorHtml() {
  const editor = document.getElementById('editor');
  if (window.html_beautify && editor) {
    const formatted = window.html_beautify(editor.textContent, {
      indent_size: 2,
      wrap_line_length: 80,
      preserve_newlines: true
    });
    editor.textContent = formatted;
    highlightEditor();
  }
}

// Auto-update on input (debounced)
let timeout;
document.getElementById('editor').addEventListener('input', () => {
  clearTimeout(timeout);
  document.getElementById('editor-status').textContent = 'Typing...';
  timeout = setTimeout(() => {
    formatEditorHtml();
    updateStyles();
    highlightEditor();
  }, 800);
});

// Initial load
const editorElem = document.getElementById('editor');
if (!editorElem.textContent.trim()) {
  editorElem.textContent = `<div class="bg-blue-500 text-white p-4 rounded-lg">\n    <h1 class="text-2xl font-bold">Hello World!</h1>\n    <p class="mt-2">This is styled with Tailwind!</p>\n</div>\n\n<div class="mt-6 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">\n    <div class="md:flex">\n        <div class="md:shrink-0">\n            <div class="h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600 md:h-full md:w-48"></div>\n        </div>\n        <div class="p-8">\n            <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">\n                Case study\n            </div>\n            <h2 class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">\n                Finding customers for your new business\n            </h2>\n            <p class="mt-2 text-gray-500">\n                Getting a new business off the ground is a lot of hard work.\n                Here are five ideas you can use to find your first customers.\n            </p>\n            <button class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">\n                Read more\n            </button>\n        </div>\n    </div>\n</div>\n\n<div class="mt-8 p-6 bg-gray-100 rounded-lg">\n    <h3 class="text-xl font-bold mb-4">✨ Tailwind Classes Examples:</h3>\n    <div class="grid gap-4">\n        <div class="bg-red-500 text-white p-3 rounded">Background: bg-red-500</div>\n        <div class="bg-green-500 text-white p-3 rounded">Background: bg-green-500</div>\n        <div class="bg-yellow-400 text-black p-3 rounded">Background: bg-yellow-400</div>\n        <div class="border-4 border-blue-500 p-3 rounded">Border: border-4 border-blue-500</div>\n        <div class="text-purple-700 font-bold text-xl">Text: text-purple-700 text-xl font-bold</div>\n    </div>\n</div>`;
  highlightEditor();
}
highlightEditor();
updateStyles();


document.getElementById('refresh').addEventListener('click', updateStyles)

// Toggle show/hide for tailwind-bundle panel
const tailwindBundle = document.getElementById('tailwind-bundle');
const toggleBundleBtn = document.getElementById('toggle-bundle');
const showBundleBtn = document.getElementById('show-bundle');

if (toggleBundleBtn && tailwindBundle && showBundleBtn) {
  toggleBundleBtn.addEventListener('click', () => {
    tailwindBundle.style.display = 'none';
    showBundleBtn.classList.remove('hidden');
  });
  showBundleBtn.addEventListener('click', () => {
    tailwindBundle.style.display = '';
    showBundleBtn.classList.add('hidden');
  });
}
