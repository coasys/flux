import { createExpression } from "@/core/mutations/createExpression";

export async function createProfile(
  expressionLanguage: string,
  username: string,
  email: string,
  givenName: string,
  familyName: string
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
      },
      signed_agent: "NA",
    })
  );
  return createProfileExpression;
}
