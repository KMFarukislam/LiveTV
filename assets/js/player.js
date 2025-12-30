const video = document.getElementById("video");
const channelList = document.getElementById("channelList");
const categoriesEl = document.getElementById("categories");
const searchInput = document.getElementById("search");
const nowPlaying = document.getElementById("nowPlaying");

let hls;
let channels = [];
let currentCategory = "All";

// Load channels
fetch("data/channels.json")
  .then(res => res.json())
  .then(data => {
    channels = data.filter(c => c.url);
    buildCategories();
    renderChannels(channels);
  });

// Build categories
function buildCategories() {
  const cats = ["All", ...new Set(channels.map(c => c.category).filter(Boolean))];

  cats.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = cat;
    if (cat === "All") li.classList.add("active");

    li.onclick = () => {
      document.querySelectorAll("#categories li").forEach(x => x.classList.remove("active"));
      li.classList.add("active");
      currentCategory = cat;
      filterChannels();
    };

    categoriesEl.appendChild(li);
  });
}

// Render channels
function renderChannels(list) {
  channelList.innerHTML = "";

  list.forEach(ch => {
    const li = document.createElement("li");

    li.innerHTML = `
      <img src="${ch.logo || ''}" onerror="this.style.display='none'">
      <span>${ch.name}</span>
    `;

    li.onclick = () => playChannel(ch, li);
    channelList.appendChild(li);
  });
}

// Play channel
function playChannel(channel, el) {
  document.querySelectorAll("#channelList li").forEach(li => li.classList.remove("active"));
  el.classList.add("active");

  nowPlaying.textContent = "Now Playing: " + channel.name;

  if (hls) hls.destroy();

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = channel.url;
  } else {
    hls = new Hls();
    hls.loadSource(channel.url);
    hls.attachMedia(video);
  }

  video.play();
}

// Filter
function filterChannels() {
  let list = channels;

  if (currentCategory !== "All") {
    list = list.filter(c => c.category === currentCategory);
  }

  const q = searchInput.value.toLowerCase();
  if (q) list = list.filter(c => c.name.toLowerCase().includes(q));

  renderChannels(list);
}

searchInput.addEventListener("input", filterChannels);
