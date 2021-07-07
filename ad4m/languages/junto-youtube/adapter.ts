import type Address from "@perspect3vism/ad4m/Address";
import type Expression from "@perspect3vism/ad4m/Expression";
import type {
  ExpressionAdapter,
  ReadOnlyLanguage,
} from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";

class YouTubePutAdapter implements ReadOnlyLanguage {
  async addressOf(data: any): Promise<Address> {
    return data.url;
  }
}

export default class YouTubeAdapter implements ExpressionAdapter {
  putAdapter: ReadOnlyLanguage;

  constructor(context: LanguageContext) {
    this.putAdapter = new YouTubePutAdapter();
  }

  async get(address: Address): Promise<void | Expression> {
    return {
      author: { did: "123", name: null, email: null },
      timestamp: "never",
      proof: null,
      data: { url: address },
    };
  }
}
