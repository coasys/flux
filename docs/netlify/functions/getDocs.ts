import fs from "fs";
import path from "path";

function getAllMarkdownFiles(dirPath, fileArr?) {
  const files = fs.readdirSync(dirPath);
  fileArr = fileArr || [];

  files.forEach(function (file) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fileArr = getAllMarkdownFiles(filePath, fileArr);
    } else if (path.extname(filePath).toLowerCase() === ".md") {
      const fileContent = fs.readFileSync(filePath, "utf8");
      fileArr.push(fileContent);
    }
  });

  return fileArr;
}

const handler: any = async (event, context) => {
  const allMarkdownFiles = getAllMarkdownFiles("./src/ui-library");
  const output = allMarkdownFiles.join("");

  return {
    statusCode: 200,
    body: JSON.stringify(output),
  };
};

export { handler };
