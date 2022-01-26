import { ad4mClient } from "@/app";
import {
  createProfile,
} from "@/core/methods/createProfile";

describe("Create Profile", () => {
  test("Create Profile - createProfile - Success", async () => {
    const mockExp =
      "QmUbmDdBMpv2vWa2kXPxcmcUtArLwAHQQgqvJ4XuDBfhtX://did:key:zQ3shYePYmPqfvWtPDuAiKUwkpPhgqSRuZurJiwH2VwdWpyWW";

    // @ts-ignore
    jest.spyOn(ad4mClient.expression, "create").mockResolvedValue(mockExp);

    const profile = await createProfile(
      "QmUWgoGt6QAMfagvQkjsHN2X3egtu3P8bcqymYMjxnqFzQ",
      {
        username: "jhon",
        email: "jhon@test.com",
        givenName: "jhon",
        familyName: "doe",
        profilePicture: "image",
        thumbnailPicture: "image",
      }
    );

    expect(profile).toBe(mockExp);
  });

  test("Create Profile - createProfile - Failure", async () => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.expression, "create")
      .mockRejectedValue(Error("Couldn't create expression"));

    try {
      await createProfile("QmUWgoGt6QAMfagvQkjsHN2X3egtu3P8bcqymYMjxnqFzQ", {
        username: "jhon",
        email: "jhon@test.com",
        givenName: "jhon",
        familyName: "doe",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty(
        "message",
        "Error: Couldn't create expression"
      );
    }
  });
});
