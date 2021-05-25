const path = require("path");

let configPath;

switch (process.platform) {
  case "darwin": {
    configPath = path.join(
      process.env.HOME,
      "Library",
      "Application Support",
      "ad4m"
    );
    break;
  }
  case "win32": {
    configPath = path.join(process.env.APPDATA, "ad4m");
    break;
  }
  case "linux": {
    configPath = path.join(process.env.HOME, ".config", "ad4m");
    break;
  }
}

console.log("Trying to delete", configPath);
