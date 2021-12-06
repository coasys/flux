export default function removeTypeName(link: any) {
  const newLink = JSON.parse(JSON.stringify(link));
  newLink.__typename = undefined;
  newLink.data.__typename = undefined;
  newLink.proof.__typename = undefined;

  return newLink;
}