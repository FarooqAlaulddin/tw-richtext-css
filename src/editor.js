// Moved from public/js/editor.js

let isUpdating = false;

async function updateStyles() {
  if (isUpdating) return;
  isUpdating = true;

  const editor = document.getElementById('editor');
  const html = editor.value;
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
    document.getElementById('css-size').textContent = cssSize + ' bytes';

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

// Auto-update on input (debounced)
let timeout;
document.getElementById('editor').addEventListener('input', () => {
  clearTimeout(timeout);
  document.getElementById('editor-status').textContent = 'Typing...';
  timeout = setTimeout(updateStyles, 800);
});

// Initial load
updateStyles();
