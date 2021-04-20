<svelte:options tag={null}/>

<script lang="ts">
    import type Expression from "ad4m/Expression";
    export let expression: Expression
</script>

<div class="container">
    {#if expression}
        <!-- <span class="header">Author:</span><span class="value">{expression.author}</span>
        <span class="header">Timestamp:</span><span class="value">{expression.timestamp}</span> -->
        <input disabled bind:value={expression.data}>
    {/if}
</div>


<style>
    .container {
        color: burlywood;
        width: 400px;
        height: 300px;
    }

    input {
        width: 100%;
        height: 300px;
        color: black;
        background: yellowgreen;
        text-align: center;
        font-size: 20px;
    }
</style>