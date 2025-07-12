import express from 'express';
import { compile, __unstable__loadDesignSystem } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src'));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.json());

// Cache the design system for better performance
let cachedDesignSystem = null;

async function getDesignSystem() {
    if (!cachedDesignSystem) {
        const inputCss = `
            @layer theme, base, components, utilities;
            @import "tailwindcss/preflight";
            @import "tailwindcss/utilities";
            @import "tailwindcss/theme.css";
        `;
        
        cachedDesignSystem = await __unstable__loadDesignSystem(inputCss, {
            base: __dirname
        });
    }
    return cachedDesignSystem;
}

async function generateCssForHtml(html, options = {}) {
    const { utilities = true, preflight = true, theme = true } = options;
    
    let inputCss = '@layer theme, base, components, utilities;\n';
    if (preflight) inputCss += '@import "tailwindcss/preflight";\n';
    if (utilities) inputCss += '@import "tailwindcss/utilities";\n';
    inputCss += '@import "tailwindcss/theme.css";\n';

    try {
        const designSystem = await getDesignSystem();
        
        const scanner = new Scanner({ sources: [] });
        const allCandidates = scanner.scanFiles([{
            content: html,
            extension: 'html'
        }]);
        
        // Method 1: Using parseCandidate
        const validCandidates = allCandidates.filter(candidate => {
            try {
                const parsed = designSystem.parseCandidate(candidate);
                return parsed && parsed.length > 0;
            } catch {
                return false;
            }
        });
        
        let inline = '\n'
        // Method 2: Using candidatesToCss (more efficient for bulk validation)
        const cssResults = designSystem.candidatesToCss(allCandidates);
        const validCandidatesAlt = allCandidates.filter((_, i) => cssResults[i] !== null)
        for(const k in validCandidatesAlt){
            inline += `@source inline("${validCandidatesAlt[k]}");\n`
        }
        console.log(inline)
        // console.log('Valid classes (parseCandidate):', validCandidates);
        // console.log('Valid classes (candidatesToCss):', validCandidatesAlt);
        // console.log('Invalid candidates tracked:', Array.from(designSystem.invalidCandidates));
        
        // Compile and build
        const compiled = await compile(inputCss, {
            base: __dirname,
            onDependency: () => {}
        });
        
        const css = compiled.build(validCandidates);
        
        return {
            css,
            stats: {
                total: allCandidates.length,
                valid: validCandidates.length,
                validClasses: validCandidates,
            }
        };
    } catch (error) {
        console.error('CSS generation error:', error);
        throw error;
    }
}

// Utility function to check a single class
async function isValidTailwindClass(className) {
    const designSystem = await getDesignSystem();
    try {
        const parsed = designSystem.parseCandidate(className);
        return parsed && parsed.length > 0;
    } catch {
        return false;
    }
}

app.post('/api/generate-css', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) {
            return res.status(400).json({ error: 'HTML content required' });
        }
        
        const result = await generateCssForHtml(html);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'CSS generation failed' });
    }
});

app.post('/api/validate-class', async (req, res) => {
    try {
        const { className } = req.body;
        const isValid = await isValidTailwindClass(className);
        res.json({ className, isValid });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Validation failed' });
    }
});

app.get('/editor', (req, res) => {
    res.render('editor');
});

app.get('/', (req, res) => {
    res.redirect('/editor');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📝 Open the editor at http://localhost:${PORT}/editor`);
});