---
layout: home
---

<div class="container">
<j-box pb="700">
<j-text variant="heading-lg">UI Playground</j-text>

<j-text size="600" color="ui-600">
Describe what kind of UI you would like to create with the Flux UI library and have AI help you get started:
</j-text>
</j-box>

<div class="grid">
<div>
<div contenteditable placeholder="Make a Todo component" @keydown="e => question = e.target.innerText">
</div>
<j-button :loading="isGenerating" full :disabled="isGenerating" size="xl" variant="primary" @click="generate">
 Generate
</j-button>
</div>
<div>

<j-tabs :value="tab" @change="e => tab = e.target.value">
<j-tab-item value="code">Code</j-tab-item>
<j-tab-item value="preview">Preview</j-tab-item>
</j-tabs>

<div class="vp-doc" v-if="tab === 'code'">

```html-vue
{{uiText}}
```

</div>

<j-box pt="400" v-if="tab === 'preview'">
<j-text v-if="isGenerating">Please wait until the AI is done generating the code to see the UI preview.</j-text>
<div v-html="uiText"></div>
</j-box>

</div>
</div>
</div>

<style scoped>

code {
  font-size: 12px;
}

.result {
  padding: var(--j-space-500);
  border-radius: var(--j-border-radius);
  background: var(--j-color-white);
  min-height: 50px;
  width: 100%;
}

.container {
  padding-top: var(--j-space-900);
  width: 100%;
  margin: 0 auto;
  max-width: calc(var(--vp-layout-max-width) - 64px)
}

.grid {
  display: grid;
  gap: var(--j-space-500);
  grid-template-columns: 1fr;
}

@media(min-width: 800px) {
  .grid {
    gap: var(--j-space-700);
    grid-template-columns: 2fr 3fr;
  }
}


div[contenteditable] {
    margin-bottom: var(--j-space-500);
    width: 100%;
    min-height: 150px;
    background: var(--j-color-ui-100);
    border-radius: var(--j-border-radius);
    padding: var(--j-space-500);
    font-size: var(--j-font-size-600);
    font-family: inherit;
    color: var(--j-color-black);
    border: none;
    overflow: none;
    outline: 0;
}

div[contenteditable]:focus {
    outline: 2px solid var(--j-color-primary-500);
}

div[placeholder]:empty::before {
  content: attr(placeholder);
  color: var(--j-color-ui-400);
}
</style>

<script setup>

//import { highlight } from 'vitepress/dist/node/index.js';
import { ref, onMounted } from 'vue'

const stopStream = ref(false);
const uiText = ref("");
const question = ref("");
const tab = ref("code");
const isGenerating = ref(false);

async function generate() {
  uiText.value = "";
  const res = await fetch("/.netlify/functions/getDocs");
  const test = await res.json();
  const shorten = test.substring(0, 8000);
  getUI(shorten);
}

async function getUI(docs) {
  try {
    isGenerating.value = true;
    stopStream.value = false;

    const response = await fetch("/buildUI", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ docs, question: question.value }),
    });

    console.log(response);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const body = response.body;

    if (!body) {
      return;
    }

    const reader = body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      console.log({value})
      if (done) {
        isGenerating.value = false;
        console.log("Done reading!");
        break;
      }
      const chunkValue = decoder.decode(value);
      console.log({ done, chunkValue, uiText });
      uiText.value = uiText.value + chunkValue;
      console.log(`Read: ${value}`);
    }
  } catch (e) {
    console.log(e);
  }
}
</script>
