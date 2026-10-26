const https = require('https');

https.get('https://baobab-api-7w7h.onrender.com/products?limit=50', (res) => {
  let raw = '';
  res.on('data', chunk => raw += chunk);
  res.on('end', () => {
    try {
      const list = JSON.parse(raw);
      const items = Array.isArray(list) ? list : list.data || [];
      const hilux = items.find(p => p.name.includes('Hilux'));
      console.log('Hilux found:');
      console.log(JSON.stringify(hilux, null, 2));
    } catch(e) {
      console.error(e);
    }
  });
});
