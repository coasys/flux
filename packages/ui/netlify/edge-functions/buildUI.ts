// @ts-ignore
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "https://esm.sh/eventsource-parser@0.1.0";
import type { Context } from "https://edge.netlify.com/";

const API_KEY = Deno.env.get("OPENAI_API_KEY");

const handler = async (req: Request, context: Context): Promise<Response> => {
  const data = await req.json();

  const stream = await OpenAIStream({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
      You are a very enthusiastic company representative who loves to help people!`,
      },
      {
        role: "user",
        content: `
Given the following sections from the documentation, answer the question using only that information and by using normal CSS and HTML, 
outputted in pure HTML. Use j-text as much as possible when using text in a component.

Context sections:
---
${data.docs}

Example response:

<style>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--j-space-500);
}

.card {
  cursor: pointer;
  width: 100%;
  background: var(--j-color-ui-100);
  border: 1px solid var(--j-color-ui-200);
  border-radius: var(--j-border-radius);
  overflow: hidden;
}

.card:hover {
  background: var(--j-color-ui-200);
}
</style>

<div class="grid">
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body" nomargin>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
    </j-box>
  </article>
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body" nomargin>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
    </j-box>
  </article>
  <article class="card">
    <img src="https://picsum.photos/600/300" />
    <j-box p="500">
      <j-text uppercase size="300">Travel</j-text>
      <j-text variant="heading">Trip Planning for beginners</j-text>
      <j-text variant="body" nomargin>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s.
      </j-text>
    </j-box>
  </article>
</div>



Question: "${data.question}"
Answer (only answer using HTML and CSS):
    `,
      },
    ],
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 500,
    stream: true,
    n: 1,
  });

  console.log(stream);

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
};

export default handler;

export const config = { path: "/buildUI" };

async function OpenAIStream(payload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let counter = 0;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY ?? ""}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  const stream = new ReadableStream({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          if (data === "[DONE]") {
            console.log("done");
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta.content;
            if (counter < 2 && (text?.match(/\n/) || []).length) {
              // Prefix character (e.g. "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            console.log(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            controller.error(e);
          }
        }
      }

      const parser = createParser(onParse);
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }

      parser.reset();
      controller.close();
    },
  });

  return stream;
}
