import { createExpression } from "@/core/mutations/createExpression";

const byteSize = (str: string) => new Blob([str]).size;

export async function createProfile(
  expressionLanguage: string,
  username: string,
  email: string,
  givenName: string,
  familyName: string,
  profileImage: string,
): Promise<string> {
  const createProfileExpression = await createExpression(
    expressionLanguage,
    JSON.stringify({
      "@context": {
        foaf: "http://xmlns.com/foaf/0.1/",
        schema: "https://schema.org/",
      },
      profile: {
        "foaf:AccountName": username,
        "schema:email": email,
        "schema:givenName": givenName,
        "schema:familyName": familyName,
        "@type": "foaf:OnlineAccount",
        "schema:image": JSON.stringify({
          "@type": "schema:ImageObject",
          "schema:contentSize": byteSize(profileImage),
          "schema:contentUrl": profileImage,
          "schema:thumbnail": {
            "@type": "schema:ImageObject",
            "schema:contentSize": byteSize(profileImage),
            "schema:contentUrl": profileImage,
          }
        })
      },
      signed_agent: "NA",
    })
  );
  return createProfileExpression;
}
