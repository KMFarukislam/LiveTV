const logosUrl = "https://iptv-org.github.io/api/channels.json";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");
const countrySelect = document.getElementById("countrySelect");

let channels = [];
let logos = {};
let hls;

/* ===== LOCAL STORAGE ===== */
const FAVORITES_KEY = "iptv_favorites";
const LAST_KEY = "iptv_last";
const COUNTRY_KEY = "iptv_country";

let favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
let selectedCountry = localStorage.getItem(COUNTRY_KEY) || "bd";
countrySelect.value = selectedCountry;

/* ===== HELPERS ===== */
function cleanName(name) {
  return name.replace(/\(.*?\)|\[.*?\]/g, "").trim().toLowerCase();
}

function isFavorite(c) {
  return favorites.includes(cleanName(c.name));
}

function toggleFavorite(c) {
  const k = cleanName(c.name);
  favorites = favorites.includes(k)
    ? favorites.filter(f => f !== k)
    : [k, ...favorites];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  render();
}

/* ===== LOAD LOGOS ===== */
fetch(logosUrl)
  .then(r => r.json())
  .then(data => {
    data.forEach(c => {
      if (c.name && c.logo) logos[cleanName(c.name)] = c.logo;
    });
    loadPlaylist(selectedCountry);
  });

/* ===== LOAD PLAYLIST ===== */
function loadPlaylist(country) {
  channels = [];
  grid.innerHTML = "Loading channels...";

  fetch(`https://iptv-org.github.io/iptv/countries/${country}.m3u`)
    .then(r => r.text())
    .then(parsePlaylist)
    .catch(() => grid.innerHTML = "Failed to load playlist");
}

function parsePlaylist(data) {
  const lines = data.split("\n");
  let ch = {};

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const raw = lines[i].split(",").pop().trim();
      const key = cleanName(raw);
      ch = {
        name: raw,
        logo:
          logos[key] ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(raw)}&background=1e293b&color=fff`
      };
    }

    if (lines[i].startsWith("http")) {
      ch.url = lines[i].trim();
      channels.push(ch);
    }
  }

  render();
}

/* ===== RENDER ===== */
function render() {
  grid.innerHTML = "";

  channels
    .filter(c =>
      !search.value || c.name.toLowerCase().includes(search.value.toLowerCase())
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

/* ===== PLAY (BUFFER FIXED) ===== */
function play(c) {
  if (!c.url.includes(".m3u8")) {
    alert("This channel is not browser supported");
    return;
  }

  nowPlaying.textContent = "Now Playing: " + c.name;
  localStorage.setItem(LAST_KEY, JSON.stringify(c));

  if (hls) hls.destroy();

  if (Hls.isSupported()) {
    hls = new Hls({
      enableWorker: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 5
    });

    hls.loadSource(c.url);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, function (_, data) {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            alert("Channel unavailable");
        }
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = c.url;
  }
}

/* ===== EVENTS ===== */
search.oninput = render;

countrySelect.onchange = () => {
  localStorage.setItem(COUNTRY_KEY, countrySelect.value);
  loadPlaylist(countrySelect.value);
};

/* ===== AUTO RESUME ===== */
const last = JSON.parse(localStorage.getItem(LAST_KEY));
if (last) play(last);
