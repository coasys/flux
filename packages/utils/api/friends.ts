import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { Ad4mClient } from "@perspect3vism/ad4m";

export async function addFriend(did: string) {
  const client: Ad4mClient = await getAd4mClient();
  await client.runtime.addFriends([did]);
}

export async function removeFriend(did: string) {
  const client: Ad4mClient = await getAd4mClient();
  return await client.runtime.removeFriends([did]);
}

export async function getFriends() {
  const client: Ad4mClient = await getAd4mClient();
  return await client.runtime.friends();
}
