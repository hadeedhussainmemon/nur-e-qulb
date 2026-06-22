const https = require('https');

function fetch(adj) {
  https.get(`https://api.aladhan.com/v1/gToH/22-06-2026?adjustment=${adj}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`adjustment=${adj}: ` + JSON.parse(data).data.hijri.day);
    });
  });
}

fetch(-1);
fetch(0);
fetch(1);
