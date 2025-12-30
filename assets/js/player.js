const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const nowPlaying = document.getElementById("nowPlaying");
const searchInput = document.getElementById("search");

let hls = null;
let channels = [];

// Load channels
fetch("data/channels.json")
  .then(res => res.json())
  .then(data => {
    channels = data;
    renderChannels(channels);
  });

// Render channel list
function renderChannels(list) {
  channelList.innerHTML = "";

  list.forEach(ch => {
    if (!ch.url) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${ch.logo || ''}" onerror="this.style.display='none'">
      <span>${ch.name}</span>
    `;

    li.onclick = () => playChannel(ch);
    channelList.appendChild(li);
  });
}

// Play channel
function playChannel(channel) {
  nowPlaying.textContent = "Now Playing: " + channel.name;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
  } else if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  } else {
    alert("Your browser does not support HLS");
  }

  video.play();
}

// Search
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(q)
  );
  renderChannels(filtered);
});
