const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const cssClasses = new Set();
const classRegex = /\.([a-zA-Z0-9_-]+)([:\s,{]|$)/g;
let match;
while ((match = classRegex.exec(cssContent)) !== null) {
  cssClasses.add(match[1]);
}

const pagesDir = path.join(__dirname, 'src', 'pages');
const allMissing = new Set();

const checkDir = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const classAttrRegex = /className=["'`](.*?)["'`]/g;
      let matchAttr;
      while ((matchAttr = classAttrRegex.exec(content)) !== null) {
        const classes = matchAttr[1].split(/\s+/).filter(Boolean);
        for (const cls of classes) {
          if (cls.includes('$') || cls.includes('?') || cls.includes(':')) continue;
          if (!cssClasses.has(cls)) {
            allMissing.add(cls);
          }
        }
      }
    }
  }
}

checkDir(pagesDir);
console.log([...allMissing].join('\n'));
