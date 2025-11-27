import { Ad4mModel, Collection, Flag, Literal, ModelOptions, Optional, Property } from "@coasys/ad4m";
import { community } from "@coasys/flux-constants";
import { EntryType } from "@coasys/flux-types";
import { SynergyGroup, SynergyItem, icons } from "@coasys/flux-utils";
import App from "../app";

const { ENTRY_TYPE, CHANNEL_NAME, CHANNEL_DESCRIPTION, CHANNEL_IS_CONVERSATION, CHANNEL_IS_PINNED } = community;

@ModelOptions({ name: "Channel" })
export class Channel extends Ad4mModel {
  @Flag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @Property({
    through: CHANNEL_NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @Optional({
    through: CHANNEL_DESCRIPTION,
    writable: true,
    resolveLanguage: "literal",
  })
  description: string;

  @Optional({
    through: CHANNEL_IS_CONVERSATION,
    writable: true,
    resolveLanguage: "literal",
  })
  isConversation: boolean;

  @Optional({
    through: CHANNEL_IS_PINNED,
    writable: true,
    resolveLanguage: "literal",
  })
  isPinned: boolean;

  @Collection({
    through: "ad4m://has_child",
    where: { isInstance: App },
  })
  views: string[] = [];

  async unprocessedItems(): Promise<SynergyItem[]> {
    // Get all unprocessed items in the channel
    try {
      const surrealQuery = `
        SELECT
          out.uri AS baseExpression,
          author,
          timestamp,
          out->link[WHERE predicate = 'flux://entry_type'][0].out.uri AS type,
          fn::parse_literal(out->link[WHERE predicate = 'flux://body'][0].out.uri) AS messageBody,
          fn::parse_literal(out->link[WHERE predicate = 'flux://title'][0].out.uri) AS postTitle,
          fn::parse_literal(out->link[WHERE predicate = 'flux://name'][0].out.uri) AS taskName
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
          AND out.uri NOT IN (
            SELECT VALUE out.uri
            FROM link
            WHERE in->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://conversation_subgroup'
              AND predicate = 'ad4m://has_child'
          )
        ORDER BY timestamp ASC
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      return (surrealResult || []).map((item: any) => {
        let text = '';
        let type = '';

        if (item.type === 'flux://has_message') {
          text = item.messageBody || '';
          type = 'Message';
        } else if (item.type === 'flux://has_post') {
          text = item.postTitle || '';
          type = 'Post';
        } else if (item.type === 'flux://has_task') {
          text = item.taskName || '';
          type = 'Task';
        }

        return {
          baseExpression: item.baseExpression,
          author: item.author,
          timestamp: new Date(item.timestamp).toISOString(),
          text,
          icon: icons[type] ? icons[type] : "question",
        };
      });
    } catch (error) {
      console.error("Error getting channel items:", error);
      return [];
    }
  }

  async totalItemCount(): Promise<number> {
    // Find the total number of items in the channel
    try {
      const surrealQuery = `
        SELECT count() AS count
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);
      return surrealResult[0]?.count || 0;
    } catch (error) {
      console.error("Error getting total item count:", error);
      return 0;
    }
  }

  async allAuthors(): Promise<string[]> {
    // Find the did of everyone who has created an item in the channel
    try {
      const surrealQuery = `
        SELECT VALUE author
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND author IS NOT NONE
          AND (
            out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_message'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_post'
            OR out->link[WHERE predicate = 'flux://entry_type'][0].out.uri = 'flux://has_task'
          )
      `;

      const surrealResult: string[] = await this.perspective.querySurrealDB(surrealQuery);

      // Deduplicate authors
      return [...new Set(surrealResult || [])];
    } catch (error) {
      console.error("Error getting channel authors:", error);
      return [];
    }
  }

  async conversations(): Promise<SynergyGroup[]> {
    // Find the necissary data to render conversations in timeline components
    try {
      // const prologQuery = `
      //   findall(ConversationInfo, (
      //     % 1. Identify all conversations in the channel
      //     subject_class("Conversation", CC),
      //     instance(CC, Conversation),
          
      //     % 2. Get timestamp from link
      //     link("${this.baseExpression}", "ad4m://has_child", Conversation, Timestamp, _),
    
      //     % 3. Retrieve conversation properties
      //     property_getter(CC, Conversation, "conversationName", ConversationName),
      //     property_getter(CC, Conversation, "summary", Summary),
    
      //     % 4. Build a single structure for each conversation
      //     ConversationInfo = [Conversation, ConversationName, Summary, Timestamp]
      //   ), Conversations).
      // `;

      const surrealQuery = `
        SELECT
          out.uri AS baseExpression,
          timestamp,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_name'][0].out.uri) AS name,
          fn::parse_literal(out->link[WHERE predicate = 'flux://has_summary'][0].out.uri) AS summary
        FROM link
        WHERE in.uri = '${this.baseExpression}'
          AND predicate = 'ad4m://has_child'
          AND out->link[WHERE predicate = 'flux://has_name'][0] IS NOT NONE
          AND out->link[WHERE predicate = 'flux://has_summary'][0] IS NOT NONE
      `;

      const surrealResult = await this.perspective.querySurrealDB(surrealQuery);

      return (surrealResult || []).map((conv: any) => ({
        baseExpression: conv.baseExpression,
        name: conv.name,
        summary: conv.summary,
        timestamp: new Date(conv.timestamp).toISOString(),
      }));
    } catch (error) {
      console.error("Error getting channel conversations:", error);
      return [];
    }
  }
}

export default Channel;
