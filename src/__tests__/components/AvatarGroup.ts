import { render } from "@testing-library/vue";
import AvatarGroup from "@/components/avatar-group/AvatarGroup.vue";
import getProfileFixture from "../fixtures/getProfile.json";
import { fireEvent } from "@testing-library/dom";

describe("Avatar Group", () => {
  test("Avatar group when there are no users", async () => {
    const { queryAllByTestId, container } = render(AvatarGroup);

    const results = await queryAllByTestId(/avatar-group__avatar__[\w:]*/);

    const seeAllBtn = container.querySelector(".avatar-group__see-all");

    expect(results).toHaveLength(0);

    expect(seeAllBtn).toBeNull();
  });

  test("Avatar group when there is only one users", async () => {
    const testProfile = {
      author: getProfileFixture.author!,
      data: JSON.parse(getProfileFixture.data!),
      timestamp: getProfileFixture.timestamp!,
      proof: getProfileFixture.proof!,
    };

    const { queryAllByTestId, container } = render(AvatarGroup, {
      props: {
        users: [testProfile],
      },
    });

    const results = await queryAllByTestId(/avatar-group__avatar__[\w:]*/);

    const seeAllBtn = container.querySelector(".avatar-group__see-all");

    expect(results).toHaveLength(1);

    expect(seeAllBtn).toBeNull();
  });

  test("Avatar group when there are more than four users", async () => {
    const testProfile = {
      author: getProfileFixture.author!,
      data: JSON.parse(getProfileFixture.data!),
      timestamp: getProfileFixture.timestamp!,
      proof: getProfileFixture.proof!,
    };

    const users = [testProfile, testProfile, testProfile, testProfile];

    const { queryAllByTestId, container } = render(AvatarGroup, {
      props: {
        users,
      },
    });

    const results = await queryAllByTestId(/avatar-group__avatar__[\w:]*/);

    const seeAllBtn = container.querySelector(".avatar-group__see-all");

    expect(results).toHaveLength(3);

    expect(seeAllBtn).not.toBeNull();
    expect(seeAllBtn?.innerHTML).toBe(` +${users.length - 3}`);
  });

  test("Avatar group check if click event is emitted", async () => {
    const testProfile = {
      author: getProfileFixture.author!,
      data: JSON.parse(getProfileFixture.data!),
      timestamp: getProfileFixture.timestamp!,
      proof: getProfileFixture.proof!,
    };

    const { queryAllByTestId, container, emitted } = render(AvatarGroup, {
      props: {
        users: [testProfile],
      },
    });

    const results = await queryAllByTestId(/avatar-group__avatar__[\w:]*/);

    const btn = container.firstChild!;

    await fireEvent.click(btn);

    expect(results).toHaveLength(1);

    expect(emitted().click.length).toBe(1);
  });
});
