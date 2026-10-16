const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const sourceFiles = ['index.html', 'portfolio.html', 'styles.css', 'app.js', '_headers'];
// Unique URLs keep returning visitors from mixing new HTML with cached code.
const versionedFiles = new Map(['styles.css', 'app.js'].map((file) => {
  const hash = createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex').slice(0, 12);
  const extension = path.extname(file);
  return [file, `${path.basename(file, extension)}.${hash}${extension}`];
}));

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

const referencedAssets = new Set();
for (const file of sourceFiles) {
  const source = path.join(root, file);
  const destination = path.join(output, versionedFiles.get(file) ?? file);
  let contents = fs.readFileSync(source, 'utf8');
  if (file.endsWith('.html')) {
    for (const [original, versioned] of versionedFiles) {
      contents = contents.replaceAll(`"${original}"`, `"${versioned}"`);
    }
  }
  fs.writeFileSync(destination, contents);
  if (!/\.(html|css|js)$/.test(file)) continue;
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
