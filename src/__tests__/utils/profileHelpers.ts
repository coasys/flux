import { ExpressionTypes } from "@/store/types";
import { getProfile } from "@/utils/profileHelpers";
import { TimeoutCache } from "@/utils/timeoutCache";
import community from "../fixtures/community.json";
import initAgentFixture from "../fixtures/initAgent.json";
import getProfileFixture from "../fixtures/getProfile.json";
import * as getExpressionNoCache from "@/core/queries/getExpression";
import { Expression } from "@perspect3vism/ad4m-types";

describe("ProfileHelpers", () => {
  let profileLangAddress: string;
  let did: string;
  let profileLink: string;

  beforeAll(() => {
    const cache = new TimeoutCache<any>(10);

    profileLangAddress = community.typedExpressionLanguages.find(
      (t) => t.expressionType === ExpressionTypes.ProfileExpression
    )!.languageAddress!;

    did = initAgentFixture.did;

    profileLink = `${profileLangAddress}://${did}`;

    cache.remove(profileLink);
  });

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(getExpressionNoCache, "getExpressionNoCache")
      .mockImplementation(async (url) => {
        const split = url.split("://");
        if (split[1] === did && split[0] === profileLangAddress) {
          return getProfileFixture as unknown as Expression;
        }

        return null;
      });
  });

  test("Test fetch profile with wrong did", async () => {
    const cache = new TimeoutCache<any>(10);

    expect(cache.get(profileLink)).toBeUndefined();

    const testProfile = {
      author: getProfileFixture.author!,
      data: JSON.parse(getProfileFixture.data!),
      timestamp: getProfileFixture.timestamp!,
      proof: getProfileFixture.proof!,
    };

    const profile = await getProfile(profileLangAddress, `${did}101`);

    expect(profile).toStrictEqual(null);
    expect(cache.get(profileLink)).toBeUndefined();
  });

  test("Test fetch the correct profile", async () => {
    const cache = new TimeoutCache<any>(10);

    expect(cache.get(profileLink)).toBeUndefined();

    const testProfile = {
      author: getProfileFixture.author!,
      data: JSON.parse(getProfileFixture.data!),
      timestamp: getProfileFixture.timestamp!,
      proof: getProfileFixture.proof!,
    };

    const profile = await getProfile(profileLangAddress, did);

    expect(profile).toStrictEqual(testProfile);
    expect(cache.get(profileLink)).not.toBeUndefined();
    expect(cache.get(profileLink)).toStrictEqual(testProfile);
  });

  test("Test fetch the correct profile from cache", async () => {
    const cache = new TimeoutCache<any>(10);

    const testProfile = {
      author: getProfileFixture.author!,
      data: JSON.parse(getProfileFixture.data!),
      timestamp: getProfileFixture.timestamp!,
      proof: getProfileFixture.proof!,
    };

    expect(cache.get(profileLink)).not.toBeUndefined();
    expect(cache.get(profileLink)).toStrictEqual(testProfile);

    const profile = await getProfile(profileLangAddress, did);

    expect(profile).toStrictEqual(testProfile);
    expect(cache.get(profileLink)).not.toBeUndefined();
    expect(cache.get(profileLink)).toStrictEqual(testProfile);
  });
});
