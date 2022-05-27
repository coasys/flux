const path = require("path");
const wget = require("wget-improved");
const fs = require("fs");
const fetch = require("node-fetch");

async function fetchLatestBootstrapSeed() {
  return new Promise(async (resolve, reject) => {
    const response = await fetch(
      "https://api.github.com/repos/perspect3vism/ad4m-seeds/releases/latest"
    );
    const data = await response.json();

    if (!fs.existsSync("./ad4m")) {
        fs.mkdirSync("./ad4m");
    }
    const dest = path.join("./ad4m", "mainnetSeed.json");
    let download;

    const link = data.assets.find((e) =>
      e.name.includes("mainnetSeed.json")
    ).browser_download_url;
    download = wget.download(link, dest);
    download.on("end", async () => {
      await fs.chmodSync(dest, "777");
      console.log("Mainnet seed download succesfully");
      resolve(null);
    });

    download.on("error", async (err) => {
      console.log("Something went wrong downloading mainnet seed");
      reject(err);
    });
  });
}

fetchLatestBootstrapSeed();
