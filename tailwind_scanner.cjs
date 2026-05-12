const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

const tailwindRegex = /className=["'`][^"'`]*\b(grid|flex|flex-col|items-center|justify-between|p-\d|px-\d|py-\d|m-\d|bg-[a-z]+-\d+|text-[a-z]+-\d+|rounded-xl|shadow-md|border-b|w-full)\b[^"'`]*["'`]/g;

console.log("--- TAILWIND AUDIT ---");
for (const file of files) {
  const filePath = path.join(pagesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = [...content.matchAll(tailwindRegex)];
  
  if (matches.length > 0) {
    console.log(`${file}: ${matches.length} possible Tailwind occurrences.`);
    const firstFew = matches.slice(0, 3).map(m => m[0]);
    console.log(`   Examples: ${firstFew.join(' | ')}`);
  }
}
