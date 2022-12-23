import { Ad4mClient, PerspectiveProxy, Subject } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

type Props = {
  perspectiveUuid: string;
  source: string;
  subject: Subject;
};

export default class SubjectFactory {
  client: Ad4mClient;
  perspective: PerspectiveProxy;
  subject: Subject;
  source: string = "ad4m://self";

  constructor(props: Props) {
    this.source = props.source || this.source;
    this.subject = props.subject;
    this.init(props.perspectiveUuid);
  }

  async init(uuid) {
    this.client = await getAd4mClient();
    const perspective = await this.client.perspective.byUUID(uuid);
    if (perspective) {
      this.perspective = perspective;
      this.perspective.ensureSDNASubjectClass(this.subject);
    }
  }
}
