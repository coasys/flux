const fs = require("fs-extra");
const wget = require("node-wget-js");
const unzipper = require("unzipper");
const path = require("path");

const languages = {
  "agent-expression-store": {
    targetDnaName: "agent-store",
    dna: "https://github.com/perspect3vism/agent-language/releases/download/0.0.7/agent-store.dna",
    bundle:
      "https://github.com/perspect3vism/agent-language/releases/download/0.0.7/bundle.js",
  },
  "neighbourhood-store": {
    targetDnaName: "neighbourhood-store",
    //dna: "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.2/neighbourhood-store.dna",
    bundle:
      "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.3/bundle.js",
  },
  "lang-note-ipfs": {
    targetDnaName: "lang-note-ipfs",
    //dna: "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.2/neighbourhood-store.dna",
    bundle:
      "https://github.com/perspect3vism/lang-note-ipfs/releases/download/0.0.1/bundle.js",
  },
  languages: {
    targetDnaName: "languages",
    bundle:
      "https://github.com/juntofoundation/language-persistence/releases/download/0.0.15/bundle.js",
  },
  "direct-message-language": {
    bundle:
      "https://github.com/perspect3vism/direct-message-language/releases/download/0.0.2/bundle.js",
  },
};

async function main() {
  await fs.ensureDir("./ad4m");
  await fs.ensureDir("./ad4m/languages");
  for (const lang in languages) {
    const dir = `./ad4m/languages/${lang}`;
    await fs.ensureDir(dir + "/build");

    // bundle
    if (languages[lang].bundle) {
      let url = languages[lang].bundle;
      let dest = dir + "/build/bundle.js";
      wget({ url, dest });
    }

    // dna
    if (languages[lang].dna) {
      url = languages[lang].dna;
      dest = dir + `/${languages[lang].targetDnaName}.dna`;
      wget({ url, dest });
    }

    if (languages[lang].zipped) {
      await wget(
        {
          url: languages[lang].resource,
          dest: `${dir}/lang.zip`,
        },
        async () => {
          //Read the zip file into a temp directory
          await fs
            .createReadStream(`${dir}/lang.zip`)
            .pipe(unzipper.Extract({ path: `${dir}` }))
            .promise();

          // if (!fs.pathExistsSync(`${dir}/bundle.js`)) {
          //   throw Error("Did not find bundle file in unzipped path");
          // }

          fs.copyFileSync(
            path.join(__dirname, `../${dir}/bundle.js`),
            path.join(__dirname, `../${dir}/build/bundle.js`)
          );
          fs.rmSync(`${dir}/lang.zip`);
          fs.rmSync(`${dir}/bundle.js`);
        }
      );
    }
  }
}

main();
