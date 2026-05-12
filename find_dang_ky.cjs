const fs = require('fs');
const files = [
    'e:\\landingpage-main\\landingpage-main\\bba.html',
];
files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        if (line.includes('id="dang-ky"')) {
            console.log(`${file}:${i+1}: ${line.trim().substring(0, 100)}`);
        }
    });
});
