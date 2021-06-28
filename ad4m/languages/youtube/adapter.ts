import type Address from "@perspect3vism/ad4m/Address";
import type Expression from "@perspect3vism/ad4m/Expression";
import type {
  ExpressionAdapter,
  ReadOnlyLanguage,
} from "@perspect3vism/ad4m/Language";

class YouTubePutAdapter implements ReadOnlyLanguage {
  async addressOf(content: object): Promise<Address> {
    return content.url;
  }
}

export default class YouTubeAdapter implements ExpressionAdapter {
  putAdapter: ReadOnlyLanguage;

  constructor() {
    this.putAdapter = new YouTubePutAdapter();
  }

  async get(address: Address): Promise<void | Expression> {}
}
