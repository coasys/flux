import { AIClient } from "@coasys/ad4m";
//@ts-ignore
import JSON5 from "json5";
import { synergyTasks, FluxLLMTask } from "./synergy-prompts";

async function ensureLLMTask(task: FluxLLMTask, ai: AIClient): Promise<FluxLLMTask> {
  const registeredTasks = await ai.tasks();
  let existingTask = registeredTasks.find((r) => r.name === task.name);
  if (!existingTask) {
    existingTask = await ai.addTask(task.name, "default", task.prompt, task.examples);
  }
  task.id = existingTask!.taskId;

  return task;
}

export async function ensureLLMTasks(ai: AIClient): Promise<{
  grouping: FluxLLMTask;
  topics: FluxLLMTask;
  conversation: FluxLLMTask;
}> {
  return {
    grouping: await ensureLLMTask(synergyTasks.grouping, ai),
    topics: await ensureLLMTask(synergyTasks.topics, ai),
    conversation: await ensureLLMTask(synergyTasks.conversation, ai),
  };
}

export async function LLMTaskWithExpectedOutputs(
  task: FluxLLMTask,
  prompt: object,
  ai: AIClient
): Promise<any | any[]> {
  let data;
  let attempts = 0;

  if((prompt as any).avoidError)
    delete (prompt as any).avoidError

  // attempt LLM task up to 5 times before giving up
  while (!data && attempts < 5) {
    attempts += 1;
    console.log(`LLM Prompt for ${task.name}`, prompt);
    const response = await ai.prompt(task.id!, JSON.stringify(prompt));
    console.log(`LLM Response for ${task.name}`, response);

    try {

      // Clean up common LLM mistakes before parsing
      let cleanResponse = response;
      // Remove any <think> blocks that the LLM might add
      cleanResponse = cleanResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
      // Remove any # comments that the LLM might add
      cleanResponse = cleanResponse.replace(/#.*$/gm, '');
      // Remove any ```json or ``` markers
      cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      // Remove any trailing commas before closing brackets/braces
      cleanResponse = cleanResponse.replace(/,(\s*[}\]])/g, '$1');
      // Remove any content after a valid JSON structure
      let arrayMatch, objectMatch;
      if (task.expectArray) {
        // Try to find a valid JSON array first if we expect an array
        arrayMatch = cleanResponse.match(/(\[[\s\S]*\])/);
        if(arrayMatch?.length)
          cleanResponse = arrayMatch[1];
        else {
          throw "expected output to be an array"
        }
      } else {
        // Try to find a valid JSON object first if we don't expect an array
        objectMatch = cleanResponse.match(/(\{[\s\S]*\})/);
        if(objectMatch?.length)
          cleanResponse = objectMatch[1];
        else {
          "expected output to be an object"
        }
      }

      console.log(`Sanitzied extracted JSON to parse: ${cleanResponse}`)
      const parsedData = JSON5.parse(cleanResponse);
      // ensure all expected properties are present
      const missingProperties = [];

      if (task.expectedOutputs) {
        for (const property of task.expectedOutputs) {
          if (!(property in parsedData)) missingProperties.push(property);
        }
      }

      if (task.expectedOneOf) {
        let foundOne = false;
        for (const property of task.expectedOneOf) {
          if (parsedData[property]) foundOne = true;
        }
        if (!foundOne) {
          missingProperties.push("expected one of: " + task.expectedOneOf);
        }
      }

      if (task.expectArray) {
        if (!Array.isArray(parsedData)) missingProperties.push("expected output to be an array");
      }

      if (missingProperties.length)
        throw new Error(`Missing expected properties: ${missingProperties.join(", ")}`);
      // the parsed data looks good
      data = parsedData;
    } catch (error) {
      console.error("LLM response parse error:", error);
      if(error.message)
        (prompt as any).avoidError = error.message;
      else
        (prompt as any).avoidError = error;
    }
  }

  if (!data) {
    throw "Failed to parse LLM response after 5 attempts. Returning empty data.";
  }

  return data;
}
