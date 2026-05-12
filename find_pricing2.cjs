const fs = require('fs');
const files = [
    'e:\\landingpage-main\\landingpage-main\\bba.html',
    'e:\\landingpage-main\\landingpage-main\\emba.html',
    'e:\\landingpage-main\\landingpage-main\\index.html'
];
files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        if (line.includes('pricing-section') || line.includes('premium-pricing-wrapper') || line.includes('bang-gia')) {
            console.log(`${file}:${i+1}: ${line.trim().substring(0, 100)}`);
        }
    });
});
