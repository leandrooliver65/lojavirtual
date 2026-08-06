const fs = require('fs');
const path = require('path');

const sourcePublicDir = path.join(__dirname, 'public');
const outputDir = path.join(__dirname, 'build');

if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

function copyRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourcePublicDir, path.join(outputDir, 'public'));

const sourceIndex = path.join(__dirname, 'index.html');
const targetIndex = path.join(outputDir, 'index.html');
if (fs.existsSync(sourceIndex)) {
  fs.copyFileSync(sourceIndex, targetIndex);
}

const source404 = path.join(__dirname, 'public', '404.html');
const target404 = path.join(outputDir, '404.html');
if (fs.existsSync(source404)) {
  fs.copyFileSync(source404, target404);
}

const sourceNoJekyll = path.join(__dirname, '.nojekyll');
const targetNoJekyll = path.join(outputDir, '.nojekyll');
if (fs.existsSync(sourceNoJekyll)) {
  fs.copyFileSync(sourceNoJekyll, targetNoJekyll);
}

console.log('Build concluído em ./build');
