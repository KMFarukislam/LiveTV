const playlistUrl = "https://iptv-org.github.io/iptv/index.m3u";
const logosUrl = "https://iptv-org.github.io/api/channels.json";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");

let channels = [];
let logos = {};
let hls;

/* =========================
   LOCAL STORAGE KEYS
========================= */
const FAVORITES_KEY = "iptv_favorites";
const RECENT_KEY = "iptv_recent";
const LAST_KEY = "iptv_last";

let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
let recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];

/* =========================
   HELPERS
========================= */
function cleanName(name) {
  return name
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .trim()
    .toLowerCase();
}

function isFavorite(channel) {
  return favorites.includes(cleanName(channel.name));
}

function toggleFavorite(channel) {
  const key = cleanName(channel.name);

  if (favorites.includes(key)) {
    favorites = favorites.filter(f => f !== key);
  } else {
    favorites.unshift(key);
  }

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  render();
}

/* =========================
   LOAD LOGOS (NON-BLOCKING)
========================= */
fetch(logosUrl)
  .then(r => r.json())
  .then(data => {
    data.forEach(c => {
      if (c.name && c.logo) {
        logos[cleanName(c.name)] = c.logo;
      }
    });
    render();
  })
  .catch(() => console.warn("Logo API skipped"));

/* =========================
   LOAD PLAYLIST
========================= */
fetch(playlistUrl)
  .then(r => r.text())
  .then(parsePlaylist)
  .catch(err => {
    console.error(err);
    grid.innerHTML = "Failed to load playlist";
  });

function parsePlaylist(data) {
  const lines = data.split("\n");
  let ch = {};
  let count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXTINF")) {
      const rawName = line.split(",").pop().trim();
      const key = cleanName(rawName);

      ch = {
        name: rawName,
        key,
        logo:
          logos[key] ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            rawName
          )}&background=1e293b&color=fff&size=80`
      };
    }

    if (line.startsWith("http")) {
      ch.url = line.trim();
      channels.push(ch);

      count++;
      if (count >= 300) break; // performance limit
    }
  }

  render();
}

/* =========================
   RENDER CHANNELS
========================= */
function render() {
  if (!grid) return;
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

/* =========================
   PLAY CHANNEL
========================= */
function play(c) {
  nowPlaying.textContent = "Now Playing: " + c.name;

  localStorage.setItem(LAST_KEY, JSON.stringify(c));

  recent = recent.filter(r => r !== c.name);
  recent.unshift(c.name);
  recent = recent.slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));

  if (hls) hls.destroy();

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(c.url);
    hls.attachMedia(video);
  } else {
    video.src = c.url;
  }
}

/* =========================
   AUTO RESUME LAST CHANNEL
========================= */
const last = JSON.parse(localStorage.getItem(LAST_KEY));
if (last) {
  play(last);
}

search.oninput = render;
