const path = require("path");
const fs = require("fs");
const readline = require("readline");

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) =>
    rl.question(query, (ans) => {
      if (ans == "y" || ans == "Y") {
        rl.close();
        resolve(ans);
      } else {
        console.log("\n Aborting...");
        process.exit(1);
      }
    })
  );
}

async function main() {
  let configPath;

  switch (process.platform) {
    case "darwin": {
      configPath = path.join(
        process.env.HOME,
        "Library",
        "Application Support",
        "junto"
      );
      break;
    }
    case "win32": {
      configPath = path.join(process.env.APPDATA, "junto");
      break;
    }
    case "linux": {
      configPath = path.join(process.env.HOME, ".config", "junto");
      break;
    }
  }

  await askQuestion(
    `Deleting ${configPath} config path.. Press Y to accept... `
  );
  fs.rmdirSync(configPath, { recursive: true });
  console.log("Done.");
}

main();
