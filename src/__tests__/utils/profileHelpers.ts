import { ProfileWithDID } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import agentByDIDLinksFixture from "../fixtures/agentByDIDLinks.json";
import { ad4mClient } from "@/app";

const testProfile = {
  did: "did:key:zQ3shsHqvZpPJzvm2PDc8kbJzWHsVhHcYSzY9KJzkxSyVpDYG101",
  email: "",
  familyName: "",
  givenName: "",
  username: "",
  bio: "",
} as ProfileWithDID;

const testProfile1 = {
  did: "did:key:zQ3shsHqvZpPJzvm2PDc8kbJzWHsVhHcYSzY9KJzkxSyVpDYG",
  email: "",
  familyName: "",
  givenName: "",
  username: "jhon",
  profileBg: "mag",
  profilePicture: "mag",
  thumbnailPicture: "mag",
  bio: "",
} as ProfileWithDID;

describe("ProfileHelpers", () => {
  const did = "did:key:zQ3shsHqvZpPJzvm2PDc8kbJzWHsVhHcYSzY9KJzkxSyVpDYG";

  beforeEach(() => {
    jest
      .spyOn(ad4mClient.agent, "byDID")
      // @ts-ignore
      .mockImplementation(async (did) => {
        if (did.includes('101')) {
          return {
            perspective: {
              links: []
            }
          }
        }
        return agentByDIDLinksFixture;
      });

    jest
      .spyOn(ad4mClient.expression, "get")
      // @ts-ignore
      .mockImplementation(async () => {
        return {
          data: "image"
        };
      });
  });

  test("Test fetch profile with wrong did", async () => {
    const profile = await getProfile(`${did}101`);

    expect(profile).toStrictEqual(testProfile);
  });

  test("Test fetch the correct profile", async () => {
    const profile = await getProfile(did);

    expect(profile).toStrictEqual(testProfile1);
  });
});
