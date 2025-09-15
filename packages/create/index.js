#!/usr/bin/env node

// Usage: npx @coasys/create-flux-plugin
const prompts = require("prompts");
const fs = require("fs");
const path = require("path");

async function run() {
  const response = await prompts([
    {
      type: "text",
      name: "projectName",
      message: `Give your plugin a name:`,
    },
    {
      type: "multiselect",
      name: "template",
      message: "Pick a template",
      choices: [
        { title: "preact", value: "preact", selected: true }
        { title: "vue", value: "vue" }
      ],
      hint: "- Space to select. Return to submit",
    },
  ]);

  // The first argument will be the project name.
  const projectName = response.projectName;
  const template = response.template;

  // Create a project directory with the project name.
  const currentDir = process.cwd();
  const projectDir = path.resolve(currentDir, projectName);
  fs.mkdirSync(projectDir, { recursive: true });

  // A common approach to building a starter template is to
  // create a `template` folder which will house the template
  // and the files we want to create.
  const templateDir = path.resolve(__dirname, `./templates/${template}`);
  fs.cpSync(templateDir, projectDir, { recursive: true });

  // It is good practice to have dotfiles stored in the
  // template without the dot (so they do not get picked
  // up by the starter template repository). We can rename
  // the dotfiles after we have copied them over to the
  // new project directory.
  fs.renameSync(
    path.join(projectDir, "gitignore"),
    path.join(projectDir, ".gitignore")
  );

  const projectPackageJson = require(path.join(projectDir, "package.json"));

  // Update the project's package.json with the new project name
  projectPackageJson.name = projectName;

  fs.writeFileSync(
    path.join(projectDir, "package.json"),
    JSON.stringify(projectPackageJson, null, 2)
  );

  console.log("Success! Your new plugin is ready.");
  console.log(
    `run cd ${projectName}, npm install, and npm run dev to start building`
  );
}

run();
