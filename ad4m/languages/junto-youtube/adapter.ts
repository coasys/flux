import type Address from "@perspect3vism/ad4m/Address";
import type Expression from "@perspect3vism/ad4m/Expression";
import type {
  ExpressionAdapter,
  ReadOnlyLanguage,
} from "@perspect3vism/ad4m/Language";
import type LanguageContext from "@perspect3vism/ad4m/LanguageContext";

class YouTubePutAdapter implements ReadOnlyLanguage {
  async addressOf(content: any): Promise<Address> {
    return content.url;
  }
}

export default class YouTubeAdapter implements ExpressionAdapter {
  putAdapter: ReadOnlyLanguage;

  constructor(context: LanguageContext) {
    this.putAdapter = new YouTubePutAdapter();
  }

  async get(address: Address): Promise<void | Expression> {
    return null;
  }
}
