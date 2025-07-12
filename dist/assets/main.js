let c=!1;async function m(){if(c)return;c=!0;const o=document.getElementById("editor").innerText,t=document.getElementById("editor-status"),n=document.getElementById("css-status"),g=document.getElementById("css-output"),h=document.getElementById("preview");t.textContent="Generating CSS...",t.className="status loading",n.textContent="Processing...",n.className="status loading";try{const s=await(await fetch("/api/generate-css",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({html:o})})).json();if(s.error)throw new Error(s.error);document.getElementById("generated-styles").textContent=s.css,g.textContent=s.css||"/* No CSS generated - no Tailwind classes found */",h.innerHTML=o;const d=new Blob([s.css]).size;let i;d<1024?i=d+" bytes":d<1024*1024?i=(d/1024).toFixed(1)+" KB":i=(d/(1024*1024)).toFixed(2)+" MB",document.getElementById("css-size").textContent=i;const b=(s.css.match(/\.[\w-]+/g)||[]).length;document.getElementById("class-count").textContent=b+" classes",t.textContent="Ready",t.className="status success",n.textContent="Generated successfully",n.className="status success"}catch(a){console.error("Failed to generate CSS:",a),t.textContent="Error: "+a.message,t.className="status error",n.textContent="Generation failed",n.className="status error",g.textContent="/* Error generating CSS */",h.innerHTML='<p style="color: red;">Error rendering preview</p>'}finally{c=!1}}function r(){const e=document.getElementById("editor");window.Prism&&Prism.highlightElement&&Prism.highlightElement(e)}function f(){const e=document.getElementById("editor");if(window.html_beautify&&e){const o=window.html_beautify(e.textContent,{indent_size:2,wrap_line_length:80,preserve_newlines:!0});e.textContent=o,r()}}let x;document.getElementById("editor").addEventListener("input",()=>{clearTimeout(x),document.getElementById("editor-status").textContent="Typing...",x=setTimeout(()=>{f(),m(),r()},800)});const y=document.getElementById("editor");y.textContent.trim()||(y.textContent=`<div class="bg-blue-500 text-white p-4 rounded-lg">
    <h1 class="text-2xl font-bold">Hello World!</h1>
    <p class="mt-2">This is styled with Tailwind!</p>
</div>

<div class="mt-6 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
    <div class="md:flex">
        <div class="md:shrink-0">
            <div class="h-48 w-full bg-gradient-to-br from-blue-500 to-purple-600 md:h-full md:w-48"></div>
        </div>
        <div class="p-8">
            <div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                Case study
            </div>
            <h2 class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
                Finding customers for your new business
            </h2>
            <p class="mt-2 text-gray-500">
                Getting a new business off the ground is a lot of hard work.
                Here are five ideas you can use to find your first customers.
            </p>
            <button class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Read more
            </button>
        </div>
    </div>
</div>

<div class="mt-8 p-6 bg-gray-100 rounded-lg">
    <h3 class="text-xl font-bold mb-4">✨ Tailwind Classes Examples:</h3>
    <div class="grid gap-4">
        <div class="bg-red-500 text-white p-3 rounded">Background: bg-red-500</div>
        <div class="bg-green-500 text-white p-3 rounded">Background: bg-green-500</div>
        <div class="bg-yellow-400 text-black p-3 rounded">Background: bg-yellow-400</div>
        <div class="border-4 border-blue-500 p-3 rounded">Border: border-4 border-blue-500</div>
        <div class="text-purple-700 font-bold text-xl">Text: text-purple-700 text-xl font-bold</div>
    </div>
</div>`,r());r();m();document.getElementById("refresh").addEventListener("click",m);const u=document.getElementById("tailwind-bundle"),p=document.getElementById("toggle-bundle"),l=document.getElementById("show-bundle");p&&u&&l&&(p.addEventListener("click",()=>{u.style.display="none",l.classList.remove("hidden")}),l.addEventListener("click",()=>{u.style.display="",l.classList.add("hidden")}));
