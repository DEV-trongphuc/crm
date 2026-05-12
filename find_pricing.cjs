const fs = require('fs');

function search(file, query) {
    if (!fs.existsSync(file)) {
        console.log(`File not found: ${file}`);
        return;
    }
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let found = false;
    lines.forEach((line, i) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
            console.log(`${file}:${i+1}: ${line.trim().substring(0, 100)}`);
            found = true;
        }
    });
    if(!found) console.log(`No results for '${query}' in ${file}`);
}

search('e:\\landingpage-main\\landingpage-main\\bba.html', 'HỌC PHÍ & LỘ TRÌNH TÀI CHÍNH');
search('e:\\landingpage-main\\landingpage-main\\emba.html', 'HỌC PHÍ & LỘ TRÌNH TÀI CHÍNH');
search('e:\\landingpage-main\\landingpage-main\\index.html', 'HỌC PHÍ & LỘ TRÌNH TÀI CHÍNH');
search('e:\\landingpage-main\\landingpage-main\\bba.html', 'CHÍNH SÁCH');
search('e:\\landingpage-main\\landingpage-main\\bba.html', 'lộ trình');
