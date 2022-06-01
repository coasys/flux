import initAgentFixture from "../../../fixtures/initAgent.json";
import addPerspectiveFixture from "../../../fixtures/addPerspective.json";
import { AgentStatus, PerspectiveHandle } from "@perspect3vism/ad4m";
import { createPinia, Pinia, setActivePinia } from "pinia";
import { useUserStore } from "@/store/user";
import { ad4mClient } from "@/app";
import agentByDIDLinksFixture from "../../../fixtures/agentByDIDLinks.json";

describe("Store Actions", () => {
  let store: Pinia;

  beforeEach(() => {
    // @ts-ignore
    jest
      .spyOn(ad4mClient.agent, "generate")
      .mockImplementation(async (password) => {
        if (password) {
          return initAgentFixture as AgentStatus;
        } else {
          throw Error("No Password passed");
        }
      });

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "add")
      // @ts-ignore
      .mockResolvedValue(addPerspectiveFixture as PerspectiveHandle);

      // @ts-ignore
      jest
        .spyOn(ad4mClient.perspective, "all")
        // @ts-ignore
        .mockResolvedValue([{
          name: "My flux perspective",
          // @ts-ignore
          neighbourhood: null,
          // @ts-ignore
          sharedUrl: null,
          uuid: "2a912c2c-6d30-46f2-b451-880349fced08"
        }]);
  

    // @ts-ignore
    jest
      .spyOn(ad4mClient.perspective, "addLink")
      // @ts-ignore
      .mockImplementation((_, link) => {
        if (link.predicate === 'sioc://has_username') {
          return agentByDIDLinksFixture.perspective.links[0]
        } else if (link.predicate === 'sioc://has_bg_image') {
          return agentByDIDLinksFixture.perspective.links[1]
        } else if (link.predicate === 'sioc://has_profile_image') {
          return agentByDIDLinksFixture.perspective.links[2]
        } else if (link.predicate === 'sioc://has_profile_thumbnail_image') {
          return agentByDIDLinksFixture.perspective.links[4]
        }
      });

        
    // @ts-ignore
    jest
      .spyOn(ad4mClient.expression, "create")
      // @ts-ignore
      .mockResolvedValue("lang://exp");

    store = createPinia();
    setActivePinia(store);
  });

  test("Create User with all the property", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();

    const profile = {
      givenName: "",
      familyName: "",
      email: "",
      username: "jhon",
      bio: "",
      profilePicture: "",
      thumbnailPicture: undefined,
    };

    await userStore.createUser({
      ...profile,
      password: "test123456",
    });

    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.isInitialized).toBeTruthy();
    expect(userStore.agent.did).toBe(initAgentFixture.did);
    expect(userStore.profile).not.toBeNull();
    expect(userStore.profile).toStrictEqual(profile);
  });

  test("Create User without password", async () => {
    const userStore = useUserStore();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();

    const profile = {
      givenName: "jhon",
      familyName: "doe",
      email: "jhon@test.com",
      username: "",
      profilePicture: "",
      thumbnailPicture: "",
    };

    try {
      await userStore.createUser({
        ...profile,
        password: "",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toHaveProperty("message", "Error: No Password passed");
    }

    expect(userStore.agent.isInitialized).toBeFalsy();
    expect(userStore.agent.isUnlocked).toBeFalsy();
    expect(userStore.agent.did).toBe("");
    expect(userStore.profile).toBeNull();
  });
});
