<svelte:options tag={null}/>

<script lang="ts">
export let settings: object
</script>

<div class="container">
    {#if settings }
        Dont need custom settings...
    {:else}
        Loading...
    {/if}
</div>
