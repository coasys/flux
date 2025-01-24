import { Ad4mClient } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
//@ts-ignore
import JSON5 from "json5";
import { synergyTasks, FluxLLMTask } from "./synergy-prompts";

async function ensureLLMTask(task: FluxLLMTask): Promise<FluxLLMTask> {
    const client: Ad4mClient = await getAd4mClient();
    const registeredTasks = await client.ai.tasks();
    let existingTask = registeredTasks.find((r) => r.name === task.name);
    if (!existingTask) {
        existingTask = await client.ai.addTask(
        task.name,
        "default", 
        task.prompt,
        task.examples
        );
    }
    task.id = existingTask!.taskId

    return task
}

export async function ensureLLMTasks(): Promise<{
    grouping: FluxLLMTask;
    topics: FluxLLMTask;
    conversation: FluxLLMTask;
}> {
    return {
        grouping: await ensureLLMTask(synergyTasks.grouping),
        topics: await ensureLLMTask(synergyTasks.topics),
        conversation: await ensureLLMTask(synergyTasks.conversation),
    };
}

export async function LLMTaskWithExpectedOutputs(
    task: FluxLLMTask,
    prompt: object
): Promise<any|any[]> {
    const client: Ad4mClient = await getAd4mClient();
    let data;
    let attempts = 0;

    // attempt LLM task up to 5 times before giving up
    while (!data && attempts < 5) {
        attempts += 1;
        console.log("LLM Prompt:", prompt);
        const response = await client.ai.prompt(task.id!, JSON.stringify(prompt));
        console.log("LLM Response: ", response);
        try {
        const parsedData = JSON5.parse(response);
        // ensure all expected properties are present
        const missingProperties = [];
        
        if(task.expectedOutputs) {
            for (const property of task.expectedOutputs) {
            if (!(property in parsedData)) missingProperties.push(property);
            }
        }

        if(task.expectArray) {
            if (!Array.isArray(parsedData)) missingProperties.push("expected output to be an array");
        }

        if (missingProperties.length) throw new Error(`Missing expected properties: ${missingProperties.join(", ")}`);
        // the parsed data looks good
        data = parsedData;
        } catch (error) {
        console.error("LLM response parse error:", error);
        //@ts-ignore
        prompt.jsonParseError = error;
        }
    }

    if (!data) {
        throw "Failed to parse LLM response after 5 attempts. Returning empty data."
    } 

    return data
}