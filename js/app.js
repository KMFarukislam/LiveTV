const playlistUrl = "https://iptv-org.github.io/iptv/index.m3u";
const logosUrl = "https://iptv-org.github.io/api/channels.json";

const grid = document.getElementById("channelGrid");
const video = document.getElementById("video");
const nowPlaying = document.getElementById("nowPlaying");
const search = document.getElementById("search");

let channels = [];
let logos = {};
let hls;

// Load playlist first (IMPORTANT)
fetch(playlistUrl)
  .then(r => r.text())
  .then(data => {
    parsePlaylist(data);
    render(); // render immediately
  })
  .catch(err => {
    console.error("Playlist load failed", err);
    grid.innerHTML = "<p>Failed to load channels</p>";
  });

// Load logos separately (NON-BLOCKING)
fetch(logosUrl)
  .then(r => r.json())
  .then(data => {
    data.forEach(c => {
      if (c.name && c.logo) logos[c.name.toLowerCase()] = c.logo;
    });
    render(); // re-render with logos
  })
  .catch(() => console.warn("Logos skipped"));

function parsePlaylist(data) {
  const lines = data.split("\n");
  let ch = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("#EXTINF")) {
      ch = {};
      ch.name = line.split(",").pop()?.trim();
    }

    if (line.startsWith("http")) {
      ch.url = line.trim();
      ch.logo =
        logos[ch.name?.toLowerCase()] ||
        "https://via.placeholder.com/80?text=TV";
      channels.push(ch);

      // 🚀 LIMIT for performance (increase later)
      if (channels.length >= 300) break;
    }
  }
}

function render() {
  if (!grid) return;

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
        <img src="${c.logo}" loading="lazy">
        <div class="channel-name">${c.name}</div>
      `;
      card.onclick = () => play(c);
      grid.appendChild(card);
    });
}

function play(c) {
  nowPlaying.textContent = "Now Playing: " + c.name;

  if (hls) hls.destroy();

  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(c.url);
    hls.attachMedia(video);
  } else {
    video.src = c.url;
  }
}

search.oninput = render;
