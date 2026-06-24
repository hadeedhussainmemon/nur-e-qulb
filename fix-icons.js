const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function fixIcons() {
  const files = ['logo.png', 'icons/icon-192x192.png', 'icons/icon-512x512.png'];
  for (const file of files) {
    const fullPath = path.join('public', file);
    if (!fs.existsSync(fullPath)) continue;
    
    const tempPath = path.join('public', file + '.tmp.png');
    
    await sharp(fullPath)
      .flatten({ background: '#020617' }) // Fills transparent background with the app's dark background color
      .toFile(tempPath);
      
    fs.renameSync(tempPath, fullPath);
    console.log(`Processed ${fullPath}`);
  }
}
fixIcons();
