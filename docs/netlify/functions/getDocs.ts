import fs from "fs";
import path from "path";

function getAllMarkdownFiles(dirPath, fileArr?) {
  const files = fs.readdirSync(dirPath);

  console.log({ files });

  fileArr = fileArr || [];

  files.forEach(function (file) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fileArr = getAllMarkdownFiles(filePath, fileArr);
    } else if (path.extname(filePath).toLowerCase() === ".md") {
      const fileContent = fs.readFileSync(filePath, "utf8");
      //Get the filename
      const parts = filePath.split('/');
      const filename = parts[parts.length - 1];

      fileArr.push("DOCUMENT: " + filename + " " + fileContent);
    }
  });

  return fileArr;
}

const handler: any = async (event, context) => {
  const allMarkdownFiles = getAllMarkdownFiles("./");
  const output = allMarkdownFiles.join("");

  return {
    statusCode: 200,
    body: JSON.stringify(output),
  };
};

export { handler };
