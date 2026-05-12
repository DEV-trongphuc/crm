const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('import { useMockStore }') && !content.includes('getFilteredMockState')) {
    content = content.replace(/import\s+{\s*useMockStore\s*}\s+from\s+['"]\.\.\/store\/mockStore['"];?/g, "import { useMockStore, getFilteredMockState } from '../store/mockStore';");
    changed = true;
  }

  if (content.includes('const state = useMockStore.getState()')) {
    content = content.replace(/const state = useMockStore\.getState\(\);/g, 'const state = getFilteredMockState();');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
};

const scan = (d) => {
  const items = fs.readdirSync(d);
  for (const item of items) {
    const fullPath = path.join(d, item);
    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
};

scan(dir);

// Also process axios.ts just in case
const axiosPath = path.join(__dirname, 'src', 'api', 'axios.ts');
if (fs.existsSync(axiosPath)) {
  processFile(axiosPath);
}
