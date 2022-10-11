import ad4mClient from "./client";

export default async function getMe() {
  try {
    const me = await ad4mClient.agent.me();
    const status = await ad4mClient.agent.status();
    return { ...me, ...status };
  } catch (e: any) {
    throw new Error(e);
  }
}
