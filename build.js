const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'public');
const outputDir = path.join(__dirname, 'build');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function copyRecursive(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyRecursive(sourceDir, outputDir);

const source404 = path.join(__dirname, 'public', '404.html');
const target404 = path.join(outputDir, '404.html');
if (fs.existsSync(source404)) {
  fs.copyFileSync(source404, target404);
}

console.log('Build concluído em ./build');
