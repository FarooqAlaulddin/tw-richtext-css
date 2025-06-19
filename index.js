import express from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ejs from 'ejs';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

// Set EJS as the view engine
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src'));

// Serve static files from dist directory (Vite build output)
app.use(express.static(path.join(__dirname, 'dist')));

// Generate Tailwind CSS for given HTML (no caching)
async function generateCssForHtml(html, options = {}) {

    const {
        includeBase = true,
        includeUtilities = true,
        includeTheme = true
    } = options;
    
    // Create temporary files
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const tempDir = path.join(__dirname, 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const htmlPath = path.join(tempDir, `temp_${timestamp}_${random}.html`);
    const inputPath = path.join(tempDir, `temp_${timestamp}_${random}.input.css`);
    const outputPath = path.join(tempDir, `temp_${timestamp}_${random}.output.css`);
    
    try {
        // Write HTML temporarily
        await fs.promises.writeFile(htmlPath, html);
        
        // @layer theme, base, components, utilities;
        // @import "tailwindcss/theme.css" layer(theme);
        // @import "tailwindcss/preflight.css" layer(base);
        // @import "tailwindcss/utilities.css" layer(utilities);
        // Create input CSS with only needed layers
        let inputCss = '@layer theme, base, components, utilities;\n';
        if (includeTheme) inputCss += '@import "tailwindcss/theme";\n';
        if (includeBase) inputCss += '@import "tailwindcss/preflight";\n';
        if (includeUtilities) inputCss += '@import "tailwindcss/utilities";\n';
        // if (includeComponents) inputCss += '@import "tailwindcss/components";\n';
        
        inputCss += `@source "${htmlPath}";`;
        
        await fs.promises.writeFile(inputPath, inputCss);
        
        // Run Tailwind CLI
        const cmd = `npx @tailwindcss/cli -i ${inputPath} -o ${outputPath} --minify`; // --minify
        await execAsync(cmd);
        
        // Read generated CSS
        let css = await fs.promises.readFile(outputPath, 'utf-8');
                
        // Clean up temp files
        await Promise.all([
            fs.promises.unlink(htmlPath),
            fs.promises.unlink(inputPath),
            fs.promises.unlink(outputPath)
        ]).catch(() => {}); // Ignore cleanup errors
        
        return css;
    } catch (error) {
        // Clean up on error
        await Promise.all([
            fs.promises.unlink(htmlPath).catch(() => {}),
            fs.promises.unlink(inputPath).catch(() => {}),
            fs.promises.unlink(outputPath).catch(() => {})
        ]);
        throw error;
    }
}

app.use(express.json());

// API endpoint for generating CSS
app.post('/api/generate-css', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) {
            return res.status(400).json({ error: 'HTML content required' });
        }
        
        // Generate CSS on-the-fly (utilities only)
        const css = await generateCssForHtml(html);
        
        res.json({ css });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'CSS generation failed' });
    }
});

// Enhanced editor page with CSS preview
app.get('/editor', (req, res) => {
    res.render('editor');
});

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/editor');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📝 Open the editor at http://localhost:${PORT}/editor`);
});