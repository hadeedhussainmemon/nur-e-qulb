const https = require('https');

function fetch(adj) {
  https.get(`https://api.aladhan.com/v1/timingsByCity?city=Makkah&country=Saudi%20Arabia&adjustment=${adj}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`adjustment=${adj}: ` + JSON.parse(data).data.date.hijri.day);
    });
  });
}

fetch(-1);
fetch(0);
fetch(1);
