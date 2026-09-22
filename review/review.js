/* Temporary public QA controls, removed after the browser review. */
const frame = document.querySelector('#preview');
const route = document.querySelector('#route');
const width = document.querySelector('#width');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const nojs = document.querySelector('#nojs');
const zoom = document.querySelector('#textZoom');
const routes = [...route.options].map(option => option.value);
const widths = [...width.options].map(option => Number(option.value));
const settle = async () => {
  const doc = frame.contentDocument;
  await doc.fonts.ready;
  if (zoom.checked) doc.documentElement.style.fontSize = '200%';
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
};
const load = (path, pixels) => new Promise((resolve, reject) => {
  frame.width = pixels;
  frame.onload = () => settle().then(resolve, reject);
  frame.src = path + "?review=20260922-3";
});
const update = () => {
  if (nojs.checked) frame.setAttribute('sandbox', 'allow-same-origin');
  else frame.removeAttribute('sandbox');
  load(route.value, Number(width.value));
};
[route,width,nojs,zoom].forEach(control => control.addEventListener('change', update));
function lock(value) {
  document.querySelectorAll('button,select,input').forEach(control => control.disabled = value);
}
document.querySelector('#layout').addEventListener('click', async () => {
  lock(true);
  const rows = [];
  try {
    for (const path of routes) {
      await load(path, widths[0]);
      for (const pixels of widths) {
        status.textContent = `Checking ${path} at ${pixels}px`;
        frame.width = pixels;
        await settle();
        const doc = frame.contentDocument;
        const brokenImages = [...doc.images].filter(img => img.complete && !img.naturalWidth).map(img => img.getAttribute('src'));
        rows.push({path, width:pixels, viewport:doc.documentElement.clientWidth, scroll:doc.documentElement.scrollWidth, overflow:doc.documentElement.scrollWidth>doc.documentElement.clientWidth+1, h1:doc.querySelector('h1')?.textContent, brokenImages});
      }
      results.textContent = JSON.stringify(rows, null, 2);
    }
    const failures = rows.filter(row => row.overflow || row.brokenImages.length || !row.h1);
    status.textContent = `Layout check complete: ${rows.length} cases; ${failures.length} failures.`;
  } catch (error) { status.textContent = String(error); }
  finally { lock(false); }
});
document.querySelector('#accessibility').addEventListener('click', async () => {
  lock(true);
  const rows = [];
  try {
    for (const path of routes) {
      status.textContent = `Accessibility: ${path}`;
      await load(path, Number(width.value));
      const script = frame.contentDocument.createElement('script');
      script.src = '/review/axe.min.js';
      await new Promise((resolve, reject) => { script.onload=resolve;script.onerror=reject;frame.contentDocument.head.append(script); });
      const scan = await frame.contentWindow.axe.run(frame.contentDocument, {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}});
      rows.push({path, width:Number(width.value), violations:scan.violations.map(item=>({id:item.id,impact:item.impact,help:item.help,nodes:item.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))})),incomplete:scan.incomplete.map(item=>({id:item.id,nodes:item.nodes.length}))});
      results.textContent = JSON.stringify(rows,null,2);
    }
    status.textContent = `Accessibility check complete: ${rows.length} pages; ${rows.reduce((sum,row)=>sum+row.violations.length,0)} violations.`;
  } catch (error) { status.textContent = String(error); }
  finally { lock(false); }
});
