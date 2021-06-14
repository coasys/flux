import { Commit } from "vuex";

import { getLinksPaginated } from "@/core/queries/getLinks";

export interface Context {
  commit: Commit;
  getters: any;
}

export interface Payload {
  channelId: string;
  from: Date;
  to: Date;
}

export default async (
  { getters, commit }: Context,
  { channelId, from, to }: Payload
): Promise<void> => {
  try {
    const fromDate = from || getters.getApplicationStartTime;
    const untilDate = to || new Date("August 19, 1975 23:15:30").toISOString();

    console.log({ fromDate, untilDate });

    const links = await getLinksPaginated(
      channelId.toString(),
      "sioc://chatchannel",
      "sioc://content_of",
      fromDate,
      untilDate
    );
    console.log("Got paginated links", links);
    commit("addMessagesIfNotPresent", {
      channelId: channelId,
      links: links,
    });
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
};
