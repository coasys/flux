export default function removeTypeName(link: any) {
  const newLink = JSON.parse(JSON.stringify(link));
  delete newLink.__typename;
  delete newLink.data.__typename;
  delete newLink.proof.__typename;
  return newLink;
}
