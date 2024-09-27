export function downloadFile(byteArray: Uint8Array, fileName: string) {
  // Create a new Blob object using the byteArray
  const blob = new Blob([byteArray], { type: "application/octet-stream" }); // Adjust the MIME type as needed

  // Create a URL for the blob
  const url = window.URL.createObjectURL(blob);

  // Create a temporary anchor (`<a>`) element
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = fileName; // Set the file name for download

  // Append the anchor to the body, click it to trigger the download, then remove it
  document.body.appendChild(a);
  a.click();

  // Cleanup: revoke the object URL and remove the anchor
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
