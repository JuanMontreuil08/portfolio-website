const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const sourceFiles = ['index.html', 'portfolio.html', 'styles.css', 'app.js', '_headers'];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const referencedAssets = new Set();
for (const file of sourceFiles) {
  const source = path.join(root, file);
  const destination = path.join(output, file);
  fs.copyFileSync(source, destination);
  if (!/\.(html|css|js)$/.test(file)) continue;
  const contents = fs.readFileSync(source, 'utf8');
  for (const match of contents.matchAll(/assets\/[\w./-]+/g)) {
    referencedAssets.add(match[0]);
  }
}

for (const asset of referencedAssets) {
  const source = path.join(root, asset);
  const destination = path.join(output, asset);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

console.log(`Built Cloudflare Pages bundle with ${referencedAssets.size} assets in ${output}`);
