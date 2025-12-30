const playlistUrl = "https://iptv-org.github.io/iptv/index.m3u";

const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const search = document.getElementById("search");
const countryFilter = document.getElementById("countryFilter");
const categoryFilter = document.getElementById("categoryFilter");
const nowPlaying = document.getElementById("nowPlaying");

let channels = [];
let hls;

fetch(playlistUrl)
  .then(res => res.text())
  .then(parsePlaylist);

function parsePlaylist(data) {
  const lines = data.split("\n");
  let channel = {};

  lines.forEach(line => {
    if (line.startsWith("#EXTINF")) {
      channel = {};
      channel.name = line.split(",")[1];
      channel.country = (line.match(/country="([^"]+)"/) || [])[1] || "";
      channel.category = (line.match(/group-title="([^"]+)"/) || [])[1] || "";
    }
    else if (line.startsWith("http")) {
      channel.url = line.trim();
      channels.push(channel);
    }
  });

  populateFilters();
  renderChannels();
}

function populateFilters() {
  [...new Set(channels.map(c => c.country).filter(Boolean))].forEach(c => {
    countryFilter.innerHTML += `<option value="${c}">${c}</option>`;
  });

  [...new Set(channels.map(c => c.category).filter(Boolean))].forEach(c => {
    categoryFilter.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function renderChannels() {
  channelList.innerHTML = "";

  channels
    .filter(c =>
      (!search.value || c.name.toLowerCase().includes(search.value.toLowerCase())) &&
      (!countryFilter.value || c.country === countryFilter.value) &&
      (!categoryFilter.value || c.category === categoryFilter.value)
    )
    .forEach(c => {
      const div = document.createElement("div");
      div.className = "channel";
      div.textContent = c.name;

      div.onclick = () => playChannel(c);
      channelList.appendChild(div);
    });
}

function playChannel(c) {
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

search.oninput = renderChannels;
countryFilter.onchange = renderChannels;
categoryFilter.onchange = renderChannels;
