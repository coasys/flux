---
outline: deep
---

# Emoji Picker

<j-emoji-picker @change="handleChange"></j-emoji-picker>

<script setup lang="ts">

function handleChange(e: any) {
    console.log(e.detail)
}

</script>
