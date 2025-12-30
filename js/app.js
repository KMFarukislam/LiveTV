const logosUrl = "https://iptv-org.github.io/api/channels.json";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");
const countrySelect = document.getElementById("countrySelect");

let channels = [];
let logos = {};
let hls;

/* ========= LOCAL STORAGE ========= */
const FAVORITES_KEY = "iptv_favorites";
const RECENT_KEY = "iptv_recent";
const LAST_KEY = "iptv_last";
const COUNTRY_KEY = "iptv_country";

let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
let recent = JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
let selectedCountry = localStorage.getItem(COUNTRY_KEY) || "bd";

countrySelect.value = selectedCountry;

/* ========= HELPERS ========= */
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

  favorites = favorites.includes(key)
    ? favorites.filter(f => f !== key)
    : [key, ...favorites];

  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  render();
}

/* ========= LOAD LOGOS ========= */
fetch(logosUrl)
  .then(r => r.json())
  .then(data => {
    data.forEach(c => {
      if (c.name && c.logo) {
        logos[cleanName(c.name)] = c.logo;
      }
    });
    loadPlaylist(selectedCountry);
  });

/* ========= LOAD PLAYLIST ========= */
function loadPlaylist(country) {
  channels = [];
  grid.innerHTML = "Loading channels...";

  const playlistUrl =
    `https://iptv-org.github.io/iptv/countries/${country}.m3u`;

  fetch(playlistUrl)
    .then(r => r.text())
    .then(parsePlaylist)
    .catch(() => {
      grid.innerHTML = "Failed to load channels";
    });
}

function parsePlaylist(data) {
  const lines = data.split("\n");
  let ch = {};

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
    }
  }

  render();
}

/* ========= RENDER ========= */
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

/* ========= PLAY ========= */
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

/* ========= EVENTS ========= */
search.oninput = render;

countrySelect.onchange = () => {
  selectedCountry = countrySelect.value;
  localStorage.setItem(COUNTRY_KEY, selectedCountry);
  loadPlaylist(selectedCountry);
};

/* ========= AUTO RESUME ========= */
const last = JSON.parse(localStorage.getItem(LAST_KEY));
if (last) play(last);
