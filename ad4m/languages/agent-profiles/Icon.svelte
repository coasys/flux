<svelte:options tag={null}/>

<script lang="ts">
    import type Expression from "ad4m/Expression";
    import type Agent from "ad4m/Agent"
    import emailValidator from "ad4m/Agent"
    import md5 from 'md5'

    export let expression: Expression

    let did, name, email

    $: if(expression) {
        const agent = (expression?.data as Agent)
        did = agent.did
        name = agent.name
        email = agent.email
    }
</script>

<div class="card">
    <div class="header">
        {#if name && name !== ""}
            <h2>{name}</h2>
            <div><strong>Email:</strong> {email}</div>
            <div class="did">{did}</div>
        {:else}
            <h2>{did}</h2>
            <div>Full name not available</div>
            <div><strong>Email</strong>: {email}</div>
        {/if}
        
    </div>

    <div class="image">
        {#if !emailValidator.validate(email) }
            <div>No gravatar image found</div>
        {:else}
            <img src="http://www.gravatar.com/avatar/{md5(email)}?s=360" alt="gravatar">
        {/if}
    </div>
</div>

<style>
    .card {
        width: 360px;
        border-radius: 4px;
        background-color: white;
    }

    .header {
        padding: 20px 5px 20px 20px
    }

    .header * {
        margin: 0;
    }

    .did {
        overflow-wrap: anywhere;
        font-size: 9px;
    }

    .image {
        position: relative;
        box-sizing: border-box;
        display: block
    }
</style>