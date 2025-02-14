import { Link, SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
import ConversationSubgroup from "../conversation-subgroup";
import { TopicWithRelevance } from "../topic";
import { ensureLLMTasks, LLMTaskWithExpectedOutputs } from "./LLMutils";
import { createEmbedding, removeEmbedding } from "./util";

@SDNAClass({
  name: "Conversation",
})
export default class Conversation extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://conversation",
  })
  type: string;

  @SubjectProperty({
    through: "flux://has_name",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  conversationName: string;

  @SubjectProperty({
    through: "flux://has_summary",
    writable: true,
    resolveLanguage: "literal",
    required: false,
  })
  summary: string;

  async subgroups(): Promise<ConversationSubgroup[]> {
    const subgroups = (await ConversationSubgroup.query(this.perspective, {
      source: this.baseExpression,
    })) as ConversationSubgroup[];

    // Sort subgroups by timestamp
    const sortedSubgroups = subgroups.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return sortedSubgroups;
  }

  private async detectNewGroup(
    currentSubgroup: ConversationSubgroup | null,
    unprocessedItems: { baseExpression: string; text: string }[]
  ): Promise<{
    group: { n: string; s: string };
    newGroup?: { n: string; s: string; firstItemId: string };
  }> {
    const { grouping } = await ensureLLMTasks(this.perspective.ai);

    let inputGroup;
    if (currentSubgroup) {
      inputGroup = {};
      inputGroup.n = currentSubgroup.subgroupName;
      inputGroup.s = currentSubgroup.summary;
    }

    let idToBaseExpression = {};
    let nextId = 0;
    for (const item of unprocessedItems) {
      idToBaseExpression[nextId] = item.baseExpression;
      nextId++;
    }
    const result = await LLMTaskWithExpectedOutputs(
      grouping,
      {
        group: inputGroup,
        unprocessedItems: unprocessedItems.map((item, index) => {
          return { id: index, text: item.text.replace(/<[^>]*>/g, "") };
        }),
      },
      this.perspective.ai
    );

    // Error correct firstItemId
    if (result.newGroup) {
      // If we have an empty conversation we always take all messages
      if (!currentSubgroup) result.newGroup.firstItemId = 0;
      else {
        // map index back to item ID
        result.newGroup.firstItemId = idToBaseExpression[result.newGroup.firstItemId];

        // if couldn't find it in map, the LLM might have returned the content of the message
        if (!result.newGroup.firstItemId) {
          result.newGroup.firstItemId = unprocessedItems.findIndex((item) => item.text == result.newGroup.firstItemId);
        }
      }
    }

    return result;
  }

  private async updateGroupTopics(group: ConversationSubgroup, newMessages: string[], isNewGroup?: boolean) {
    const { topics } = await ensureLLMTasks(this.perspective.ai);
    let currentTopics = (await group.topicsWithRelevance()) as any;
    let prompt
    if(currentTopics.length)
      prompt = currentTopics.map((t) => {
        return `${t.name} (${t.relevance})`;
      }).join("\n");
    else
      prompt = "<no topics yet>";
    prompt += "\n\nmessages:\n" + newMessages.map(m => { return m.replace(/<[^>]*>/g, "") }).join("\n");

    let currentNewTopics = await LLMTaskWithExpectedOutputs(
      topics,
      prompt,
      this.perspective.ai
    );

    for (const topic of currentNewTopics) {
      await group.updateTopicWithRelevance(topic.n, topic.rel, isNewGroup);
    }
  }

  private async createNewGroup(newGroup: { n: string; s: string }) {
    let newSubgroupEntity = new ConversationSubgroup(this.perspective, undefined, this.baseExpression);
    newSubgroupEntity.subgroupName = newGroup.n;
    newSubgroupEntity.summary = newGroup.s;
    await newSubgroupEntity.save();
    return await newSubgroupEntity.get();
  }

  async processNewExpressions(unprocessedItems) {
    const subgroups = await this.subgroups();
    const currentSubgroup: ConversationSubgroup | null = subgroups.length ? subgroups[subgroups.length - 1] : null;

    // ============== LLM group detection ===============================
    // Have LLM sort new messages into old group or detect subject change
    let detectResult = await this.detectNewGroup(currentSubgroup, unprocessedItems);

    // Handle case where the conversation is empty (no group yet) but LLM returns data in group and not in newGroup
    if (!currentSubgroup && detectResult.group && !detectResult.newGroup) {
      detectResult.newGroup = { ...detectResult.group, firstItemId: unprocessedItems[0].id };
      detectResult.group = null;
    }

    // create new subgroup if returned from LLM
    let newSubgroupEntity;
    let indexOfFirstItemInNewSubgroup;
    if (detectResult.newGroup) {
      newSubgroupEntity = await this.createNewGroup(detectResult.newGroup);
      indexOfFirstItemInNewSubgroup = unprocessedItems.findIndex(
        (item) => item.baseExpression === detectResult.newGroup.firstItemId
      );
    }

    // Sort items into current and/or new group
    const newLinks: Link[] = [];
    const currentNewMessages: string[] = [];
    const newGroupMessages: string[] = [];
    for (const [itemIndex, item] of unprocessedItems.entries()) {
      let itemsSubgroup;
      if ((detectResult.newGroup && itemIndex >= indexOfFirstItemInNewSubgroup) || !currentSubgroup) {
        itemsSubgroup = newSubgroupEntity;
        newGroupMessages.push(item.text);
      } else {
        itemsSubgroup = currentSubgroup;
        currentNewMessages.push(item.text);
      }
      newLinks.push({
        source: itemsSubgroup.baseExpression,
        predicate: "ad4m://has_child",
        target: item.baseExpression,
      });
    }

    // ============== LLM topic list updating ===============================
    // Get update topic lists from LLM and save results
    if (currentSubgroup) await this.updateGroupTopics(currentSubgroup, currentNewMessages);
    if (detectResult.newGroup) await this.updateGroupTopics(newSubgroupEntity, newGroupMessages, true);

    // ============== LLM conversation updating ===============================
    // Gather list of all sub-group name and info as it is now after this processing

    // update current group info in the array
    if (currentSubgroup && detectResult.group) {
      currentSubgroup.subgroupName = detectResult.group.n;
      currentSubgroup.summary = detectResult.group.s;
      subgroups[subgroups.length - 1] = currentSubgroup;
    }

    // create array with property names for the prompt
    const promptArray = subgroups.map((g) => {
      return { n: g.subgroupName, s: g.summary };
    });

    // Add new group if one was detected
    if (detectResult.newGroup) promptArray.push({ n: detectResult.newGroup.n, s: detectResult.newGroup.s });

    let promptString = promptArray.map((p) => {
      return `${p.n}\n${p.s}`;
    }).join("\n\n");

    const { conversation } = await ensureLLMTasks(this.perspective.ai);
    let newConversationInfo = await LLMTaskWithExpectedOutputs(conversation, promptString, this.perspective.ai);

    // ------------ saving all new data ------------------

    // Save conversation info
    this.conversationName = newConversationInfo.n;
    this.summary = newConversationInfo.s;
    await this.update();

    // Save current group
    if (currentSubgroup) await currentSubgroup.update();

    // create vector embeddings for each unprocessed item
    await Promise.all(
      unprocessedItems.map((item) =>
        createEmbedding(this.perspective, item.text, item.baseExpression, this.perspective.ai)
      )
    );

    // update vector embedding for conversation
    await removeEmbedding(this.perspective, this.baseExpression);
    await createEmbedding(this.perspective, this.summary, this.baseExpression, this.perspective.ai);

    // update vector embedding for currentSubgroup if returned from LLM
    if (currentSubgroup) {
      await removeEmbedding(this.perspective, currentSubgroup.baseExpression);
      await createEmbedding(
        this.perspective,
        currentSubgroup.summary,
        currentSubgroup.baseExpression,
        this.perspective.ai
      );
    }
    // create vector embedding for new subgroup if returned from LLM
    if (newSubgroupEntity) {
      await createEmbedding(
        this.perspective,
        newSubgroupEntity.summary,
        newSubgroupEntity.baseExpression,
        this.perspective.ai
      );
    }

    // batch commit all new links (currently only "ad4m://has_child" links)
    // i.e. sorting messages into current and/or new sub-group
    await this.perspective.addLinks(newLinks);
  }
}
