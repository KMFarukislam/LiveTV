const PLAYLIST_URL = "https://iptv-org.github.io/iptv/index.m3u";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");

let channels = [];
let hls;

/* ===== LOAD PLAYLIST ===== */
fetch(PLAYLIST_URL)
  .then(r => r.text())
  .then(parsePlaylist)
  .catch(() => {
    grid.innerHTML = "Failed to load channels";
  });

function parsePlaylist(data) {
  const lines = data.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("#EXTINF")) {
      const name = lines[i].split(",").pop().trim();
      const url = lines[i + 1];

      if (url && url.startsWith("http")) {
        channels.push({
          name,
          url,
          logo: "https://via.placeholder.com/80?text=TV"
        });
      }

      // LIMIT (this is IMPORTANT)
      if (channels.length >= 3000) break;
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
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "channel-card";
      card.innerHTML = `
        <img src="${c.logo}">
        <div class="channel-name">${c.name}</div>
      `;

      card.onclick = () => play(c);
      grid.appendChild(card);
    });
}

/* ===== PLAY (SIMPLE & WORKING) ===== */
function play(c) {
  nowPlaying.textContent = "Now Playing: " + c.name;

  if (hls) hls.destroy();

  if (Hls.isSupported() && c.url.includes(".m3u8")) {
    hls = new Hls();
    hls.loadSource(c.url);
    hls.attachMedia(video);
  } else {
    video.src = c.url;
  }
}

/* ===== SEARCH ===== */
search.oninput = render;
