const fs = require("fs");

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error("Usage: node m3u_to_json.js input.m3u output.json");
  process.exit(1);
}

const lines = fs.readFileSync(inputFile, "utf8").split("\n");

let channels = [];
let currentChannel = null;

for (let line of lines) {
  line = line.trim();

  if (line.startsWith("#EXTINF")) {
    const name = line.match(/,(.*)$/);
    const tvgId = line.match(/tvg-id="([^"]*)"/);
    const logo = line.match(/tvg-logo="([^"]*)"/);
    const group = line.match(/group-title="([^"]*)"/);

    currentChannel = {
      name: name ? name[1] : "",
      tvg_id: tvgId ? tvgId[1] : "",
      logo: logo ? logo[1] : "",
      category: group ? group[1] : "",
      url: ""
    };
  } 
  else if (line && !line.startsWith("#") && currentChannel) {
    currentChannel.url = line;
    channels.push(currentChannel);
    currentChannel = null;
  }
}

fs.writeFileSync(outputFile, JSON.stringify(channels, null, 2));
console.log(`✔ Saved ${channels.length} channels to ${outputFile}`);
