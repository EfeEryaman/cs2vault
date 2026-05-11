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

// Steam profile
app.get('/api/profile/:steamid', async (req, res) => {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${req.params.steamid}`;
    const r = await fetch(url);
    const data = await r.json();
    const player = data.response?.players?.[0];
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({
      steamid: player.steamid,
      name: player.personaname,
      avatar: player.avatarfull,
      status: player.personastate === 1 ? 'online' : 'offline'
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Steam inventory
app.get('/api/inventory/:steamid', async (req, res) => {
  try {
    const url = `https://steamcommunity.com/inventory/${req.params.steamid}/730/2?l=turkish&count=75`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
    });
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Steam market price
app.get('/api/price', async (req, res) => {
  try {
    const name = req.query.name;
    const url = `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodeURIComponent(name)}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
    });
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Get skin image via Steam Asset Class Info API
app.get('/api/iteminfo', async (req, res) => {
  try {
    const name = req.query.name;
    // Search market to get classid
    const searchUrl = `https://steamcommunity.com/market/search/render/?appid=730&norender=1&count=1&query=${encodeURIComponent(name)}`;
    const r = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
    });
    const data = await r.json();
    
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      const iconUrl = item.asset_description?.icon_url;
      const price = item.sell_price_text;
      const img = iconUrl ? `https://community.fastly.steamstatic.com/economy/image/${iconUrl}/360fx360f` : null;
      res.json({ 
        img, 
        price,
        name: item.name,
        hash_name: item.hash_name
      });
    } else {
      res.json({ img: null, price: null });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`CS2 Vault backend running on port ${PORT}`));
