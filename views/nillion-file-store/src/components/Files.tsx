import { useRef } from "preact/hooks";

import styles from "./FileView.module.css";

interface FileProps {
  files: any[];
  handleGetQuote: (name: string, storeId: string, secretId: string) => void;
  deleteFile: (id: string) => void;
  profiles: Map<string, any>;
}

export default function Files({
  files,
  handleGetQuote,
  deleteFile,
  profiles,
}: FileProps) {
  return (
    <>
      <div style={{ width: "100%" }}>
        {files.map((file, index) => (
          <div className={styles.file} key={index}>
            <div style={{ maxWidth: "160px", minWidth: "80px" }}>
              <j-text color="ui-800" weight="500" size="500">
                {file.name}
              </j-text>
              <j-flex a="center" j="start" gap="200">
                <j-avatar
                  size="xs"
                  src={profiles.get(file.author)?.profileImage}
                  hash={file.author}
                ></j-avatar>
                <j-text nomargin size="300">
                  {profiles.get(file.author)?.username || "Anonymous"}
                </j-text>
              </j-flex>
            </div>

            <div style={{ flex: 1 }}>
              <progress style={{ width: "100%" }} value="100"></progress>
              <j-text nomargin size="300" uppercase>
                Size: {file.size} MB
              </j-text>
            </div>

            <j-flex a="center" j="between" gap="200" direction="row">
              <progress style={{ width: "100%" }} value="100"></progress>
              <j-button
                square
                variant="subtle"
                size="sm"
                onClick={() =>
                  handleGetQuote(file.name, file.storeId, file.secretId)
                }
              >
                <j-icon name="download" />
              </j-button>
              <j-button
                square
                variant="subtle"
                size="sm"
                onClick={() => deleteFile(file.baseExpression)}
              >
                <j-icon name="x" />
              </j-button>
            </j-flex>
          </div>
        ))}
      </div>
    </>
  );
}
