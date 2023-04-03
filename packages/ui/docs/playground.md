---
layout: home
---

<div class="container vp-doc">
<div class="grid">
<div>
<j-flex a="center" gap="500">
  <j-input size="xl" full placeholder="Make a Todo component" :value="question" @input="e => question = e.target.value"></j-input>
  <j-button size="xl" variant="primary" @click="generate">Generate</j-button>
</j-flex>
<div v-if="uiText">

```html-vue
{{uiText}}
```

</div>
</div>
<div>
  <j-text variant="heading">Result</j-text>
  <div v-html="uiText"></div>
</div>
</div>
</div>

<style scoped>

code {
  font-size: 12px;
}

.container {
  padding-top: var(--j-space-900);
  width: 100%;
  margin: 0 auto;
  max-width: calc(var(--vp-layout-max-width) - 64px)
}

.grid {
  height: 100vh;
  overflow-y: auto;
  display: grid;
  gap: var(--j-space-500);
  grid-template-columns: 1fr 1fr;
}


div[contenteditable] {
    margin-top: var(--j-space-500);
    margin-bottom: var(--j-space-500);
    width: 100%;
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

[placeholder]:empty::before {
    content: attr(placeholder);
    color: var(--j-color-ui-400);
}
</style>

<script setup>

//import { highlight } from 'vitepress/dist/node/index.js';
import { ref, onMounted } from 'vue'

onMounted(() => {
  console.log('hello')
})

const stopStream = ref(false);
const uiText = ref("");
const question = ref("");

async function generate() {
  uiText.value = "";
  const res = await fetch("/.netlify/functions/getDocs");
  const test = await res.json();
  getUI(test);
}

async function getUI(docs) {
  try {
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
