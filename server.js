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
      status: player.personastate === 1 ? 'online' : 'offline',
      profileurl: player.profileurl
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
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
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const data = await r.json();
    res.json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Steam market listing (for image hash)
app.get('/api/listing', async (req, res) => {
  try {
    const name = req.query.name;
    const url = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(name)}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await r.text();
    const match = html.match(/economy\/image\/([^\/'"]+)\/[0-9]+fx[0-9]+f/);
    if (match) {
      res.json({ hash: match[1], img: `https://community.fastly.steamstatic.com/economy/image/${match[1]}/360fx360f` });
    } else {
      res.json({ hash: null, img: null });
    }
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`CS2 Vault backend running on port ${PORT}`));
