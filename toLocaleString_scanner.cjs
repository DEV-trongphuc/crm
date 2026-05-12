const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

console.log("--- UNSAFE toLocaleString AUDIT ---");
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all .toLocaleString
  const regex = /([a-zA-Z0-9_?.\[\]]+)\.toLocaleString/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const varName = match[1];
    // Check if it's potentially unsafe (no ? before dot, or simple variable)
    if (!varName.endsWith('?') && !content.includes(`(${varName} || 0).toLocaleString`) && !content.includes(`typeof ${varName}`)) {
        console.log(`${file}: Unsafe usage -> ${varName}.toLocaleString()`);
    }
  }
}
