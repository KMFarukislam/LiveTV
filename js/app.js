
const PLAYLIST_URL = "https://iptv-org.github.io/iptv/streams.m3u";
const LOGOS_URL = "https://iptv-org.github.io/api/channels.json";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");

let channels = [];
let logos = {};
let hls;

/* ===== FAVORITES ===== */
const FAVORITES_KEY = "iptv_favorites";
let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];

/* ===== HELPERS ===== */
function cleanName(name) {
  return name.replace(/\(.*?\)|\[.*?\]/g, "").trim().toLowerCase();
}

function isFavorite(c) {
  return favorites.includes(cleanName(c.name));
}

function toggleFavorite(c) {
  const key = cleanName(c.name);
  favorites = favorites.includes(key)
    ? favorites.filter(f => f !== key)
    : [key, ...favorites];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  render();
}

/* ===== LOAD LOGOS ===== */
fetch(LOGOS_URL)
  .then(r => r.json())
  .then(data => {
    data.forEach(c => {
      if (c.name && c.logo) {
        logos[cleanName(c.name)] = c.logo;
      }
    });
    loadPlaylist();
  });

/* ===== LOAD PLAYLIST ===== */
function loadPlaylist() {
  fetch(PLAYLIST_URL)
    .then(r => r.text())
    .then(parsePlaylist)
    .catch(() => {
      grid.innerHTML = "Failed to load channels";
    });
}

/* ===== FIXED PARSER FOR streams.m3u ===== */
function parsePlaylist(data) {
  const lines = data.split("\n");
  channels = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF")) {
      const rawName = line.split(",").pop().trim();
      const key = cleanName(rawName);

      current = {
        name: rawName,
        logo:
          logos[key] ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            rawName
          )}&background=1e293b&color=fff`
      };
      continue;
    }

    // skip metadata lines
    if (line.startsWith("#")) continue;

    // real stream URL
    if (current && line.startsWith("http") && line.includes(".m3u8")) {
      current.url = line;
      channels.push(current);
      current = null;
    }
  }

  render();
}

/* ===== RENDER ===== */
function render() {
  grid.innerHTML = "";

  channels
    .filter(c =>
      !search.value ||
      c.name.toLowerCase().includes(search.value.toLowerCase())
    )
    .sort((a, b) => isFavorite(b) - isFavorite(a))
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "channel-card";
      card.innerHTML = `
        <div class="star ${isFavorite(c) ? "active" : ""}">★</div>
        <img src="${c.logo}" loading="lazy">
        <div class="channel-name">${c.name}</div>
      `;

      card.querySelector(".star").onclick = e => {
        e.stopPropagation();
        toggleFavorite(c);
      };

      card.onclick = () => play(c);
      grid.appendChild(card);
    });
}

/* ===== PLAY (BROWSER SAFE) ===== */
function play(c) {
  nowPlaying.textContent = "Now Playing: " + c.name;

  if (hls) hls.destroy();

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      maxBufferLength: 30,
      liveSyncDurationCount: 3
    });

    hls.loadSource(c.url);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        hls.destroy();
        alert("This stream is unavailable");
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = c.url;
  }
}

/* ===== SEARCH ===== */
search.oninput = render;
