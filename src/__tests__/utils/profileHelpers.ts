import { ExpressionTypes, ProfileExpression } from "@/store/types";
import { getProfile, parseProfile } from "@/utils/profileHelpers";
import {TimeoutCache} from "@/utils/timeoutCache";
import community from "../fixtures/community.json";
import initAgentFixture from "../fixtures/initAgent.json";
import getProfileFixture from "../fixtures/getProfile.json";
import * as getExpressionNoCache from "@/core/queries/getExpression";
import { Expression } from "@perspect3vism/ad4m";
import { mocked } from 'ts-jest/utils';

const testProfile = {
  did: initAgentFixture.did,
  data: JSON.parse(getProfileFixture.data!)
} as ProfileExpression;

jest.mock('@/utils/timeoutCache', () => {
  return {
    TimeoutCache: jest.fn().mockImplementation(() => {
      return {
        set: jest.fn(),
        get: (link: string) => {
          if (link.includes('101')) {
            return undefined
          } else {
            return testProfile;
          }
        },
        remove: jest.fn(),
      };
    })
  };
});

describe("ProfileHelpers", () => {
  const MockedSoundPlayer = mocked(TimeoutCache, true);
  
  let profileLangAddress: string;
  let did: string;
  let profileLink: string;

  beforeAll(async () => {
    const cache = new TimeoutCache<any>(10);

    profileLangAddress = community.neighbourhood.typedExpressionLanguages.find(
      (t: any) => t.expressionType === ExpressionTypes.ProfileExpression
    )!.languageAddress!;

    did = initAgentFixture.did;

    profileLink = `${profileLangAddress}://${did}`;

    await cache.remove(profileLink);
  });

  beforeEach(() => {
    MockedSoundPlayer.mockClear();

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
    const profile = await getProfile(profileLangAddress, `${did}101`);

    expect(profile).toStrictEqual(null);
  });

  test("Test fetch the correct profile", async () => {
    const newTestProfile = {
      did: testProfile.did,
      ...parseProfile(testProfile.data.profile)
    };

    const profile = await getProfile(profileLangAddress, did);


    expect(profile).toStrictEqual(newTestProfile);
  });
});
