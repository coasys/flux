<svelte:options tag={null}/>

<script lang="ts">
    export let commitExpression
    export let discard

    let did = ""

</script>

<div class="container">
    <input bind:value={did}>
    <button on:click={()=>commitExpression({did})}>Commit</button>
    <button on:click={discard}>Discard</button>
</div>


<style>
    .container {
        color: burlywood;
        width: 400px;
        height: 150px;
    }

    input {
        width: 100%;
    }
</style>