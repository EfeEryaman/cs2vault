const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STEAM_API_KEY = process.env.STEAM_API_KEY || 'F63CD7ADEB27F331C560DAA191244CC0';

app.use(cors());
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/profile/:steamid', async (req, res) => {
  try {
    const r = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${req.params.steamid}`);
    const data = await r.json();
    const p = data.response?.players?.[0];
    if (!p) return res.status(404).json({ error: 'Bulunamadı' });
    res.json({ steamid: p.steamid, name: p.personaname, avatar: p.avatarfull, status: p.personastate === 1 ? 'online' : 'offline' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/inventory/:steamid', async (req, res) => {
  try {
    const r = await fetch(`https://steamcommunity.com/inventory/${req.params.steamid}/730/2?l=turkish&count=75`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const data = await r.json();
    res.json(data);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/market', async (req, res) => {
  try {
    const name = req.query.name;
    const [priceRes, searchRes] = await Promise.all([
      fetch(`https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }),
      fetch(`https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=1&query=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      })
    ]);
    const price = await priceRes.json();
    const search = await searchRes.json();
    const item = search.results?.[0];
    const img = item?.asset_description?.icon_url
      ? `https://community.fastly.steamstatic.com/economy/image/${item.asset_description.icon_url}/360fx360f`
      : null;
    res.json({ price: price.lowest_price || null, volume: price.volume || '0', img });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`CS2 Vault çalışıyor: ${PORT}`));
