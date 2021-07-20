const fs = require("fs-extra");
const wget = require("node-wget-js");

const languages = {
  profiles: {
    targetDnaName: "agent-profiles",
    dna: "https://github.com/jdeepee/profiles/releases/download/0.0.3/agent-profiles.dna",
    bundle:
      "https://github.com/jdeepee/profiles/releases/download/0.0.3/bundle.js",
  },
  "agent-expression-store": {
    targetDnaName: "agent-store",
    dna: "https://github.com/perspect3vism/agent-language/releases/download/0.0.3/agent-store.dna",
    bundle:
      "https://github.com/perspect3vism/agent-language/releases/download/0.0.3/bundle.js",
  },
  "neighbourhood-store": {
    targetDnaName: "neighbourhood-store",
    dna: "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.1/neighbourhood-store.dna",
    bundle:
      "https://github.com/perspect3vism/neighbourhood-language/releases/download/0.0.1/bundle.js",
  },
  languages: {
    targetDnaName: "languages",
    dna: "https://github.com/perspect3vism/language-persistence/releases/download/0.0.1/languages.dna",
    bundle:
      "https://github.com/perspect3vism/language-persistence/releases/download/0.0.1/bundle.js",
  },
  "group-expression": {
    targetDnaName: "group-expression",
    dna: "https://github.com/juntofoundation/Group-Expression/releases/download/0.0.1/group-expression.dna",
    bundle:
      "https://github.com/juntofoundation/Group-Expression/releases/download/0.0.1/bundle.js",
  },
  "shortform-expression": {
    targetDnaName: "shortform-expression",
    dna: "https://github.com/juntofoundation/Short-Form-Expression/releases/download/0.0.1/shortform-expression.dna",
    bundle:
      "https://github.com/juntofoundation/Short-Form-Expression/releases/download/0.0.1/bundle.js",
  },
};

async function main() {
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
  }
}

main();
