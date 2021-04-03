<svelte:options tag={null}/>

<script lang="ts">
    import '@simonwep/pickr/dist/themes/nano.min.css';      // 'nano' theme
    import Pickr from '@simonwep/pickr';
    import { afterUpdate, onMount } from 'svelte';

    let picker
    let container
    export let colour = '#9C27B0E6'
    let index = 1
    let pickers = [{'index': 1, 'color': colour}]

    const createPickr = ({picker}) => {
        const pickr = Pickr.create({
            el: picker,
            theme: 'nano', // or 'monolith', or 'nano'
            container: container,

            swatches: [
                'rgba(244, 67, 54, 1)',
                'rgba(233, 30, 99, 0.95)',
                'rgba(156, 39, 176, 0.9)',
                'rgba(103, 58, 183, 0.85)',
                'rgba(63, 81, 181, 0.8)',
                'rgba(33, 150, 243, 0.75)',
                'rgba(3, 169, 244, 0.7)',
                'rgba(0, 188, 212, 0.7)',
                'rgba(0, 150, 136, 0.75)',
                'rgba(76, 175, 80, 0.8)',
                'rgba(139, 195, 74, 0.85)',
                'rgba(205, 220, 57, 0.9)',
                'rgba(255, 235, 59, 0.95)',
                'rgba(255, 193, 7, 1)'
            ],

            components: {
                // Main components
                preview: true,
                opacity: true,
                hue: true,

                // Input / output Options
                interaction: {
                    hex: true,
                    input: true,
                    clear: true,
                    save: true
                }
            }
        });

        pickr.on('save', (color, instance) => {
            console.log('Event: "save"', color, instance);
            colour = color.toHEXA().toString();
            console.log("Colour is now", colour);
        });
    }


    onMount(() => {
        createPickr(picker)
        // const pickr = Pickr.create({
        //     el: picker,
        //     theme: 'nano', // or 'monolith', or 'nano'
        //     container: container,

        //     swatches: [
        //         'rgba(244, 67, 54, 1)',
        //         'rgba(233, 30, 99, 0.95)',
        //         'rgba(156, 39, 176, 0.9)',
        //         'rgba(103, 58, 183, 0.85)',
        //         'rgba(63, 81, 181, 0.8)',
        //         'rgba(33, 150, 243, 0.75)',
        //         'rgba(3, 169, 244, 0.7)',
        //         'rgba(0, 188, 212, 0.7)',
        //         'rgba(0, 150, 136, 0.75)',
        //         'rgba(76, 175, 80, 0.8)',
        //         'rgba(139, 195, 74, 0.85)',
        //         'rgba(205, 220, 57, 0.9)',
        //         'rgba(255, 235, 59, 0.95)',
        //         'rgba(255, 193, 7, 1)'
        //     ],

        //     components: {

        //         // Main components
        //         preview: true,
        //         opacity: true,
        //         hue: true,

        //         // Input / output Options
        //         interaction: {
        //             hex: true,
        //             input: true,
        //             clear: true,
        //             save: true
        //         }
        //     }
        // });

        // pickr.on('save', (color, instance) => {
        //     console.log('Event: "save"', color, instance);
        //     colour = color.toHEXA().toString();
        //     console.log("Colour is now", colour);
        // });
    });
    export let commitExpression

    let expData = {
        body: "",
        background: []
    };

    const addPicker = () => {
        const c = '#9C27B0E6'
        const i = index += 1
        pickers.push({'index': i, 'color': c})
        pickers = pickers
        console.log("addPicker clicked", pickers)
    }

    afterUpdate(() => {
        console.log("afterUpdate")
    })
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css"/> <!-- 'nano' theme -->

<div class="container" id="exp_container" bind:this={container} style="--theme-color: {colour}">
    <div class="typings">
        <textarea bind:value={expData.body} />
    </div>
    <div class="clickings">
        <div class="picker-container">
            <span>Pickers</span>
            <div class="pickers">
                {#each pickers as pickerObj, index (pickerObj.index)}
                    <span>Picker {pickerObj.index}</span>
                    <div bind:this={picker}></div>
                {/each}
                <button on:click={addPicker}>+</button>
            </div>
        </div>

        <div class="button">
            <button on:click={()=>commitExpression(JSON.stringify(expData))}>Commit</button>
        </div>
    </div>
</div>


<style lang="scss">
    .container {
        background-color: var(--theme-color);
        width: 80%;
        height: 20rem;
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-evenly;
        align-items: center;
        margin: 35% auto;
        border-radius: 15px;
        color: #fff;
        .typings {
            width: 55%;
            height: 40%;
            textarea {
                width: 100%;
                height: 100%;
                color: #fff;
                background: rgba(0.5,0.5,0.5,0.4);
                cursor: text;
                caret-color: #fff;
                text-align: center;
                font-size: 1.4rem;
                border-radius: 15px;
                &:focus {
                    outline: none;
                    border: 1px solid #fff;
                }
            }
        }
        .clickings {
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            width: 55%;

            .picker-container {
                display: flex;
                flex-flow: column nowrap;
                align-items: center;
                width: 45%;
                span {
                    font-size: 1.4rem;
                }
                .pickers {
                    display: flex;
                    justify-content: space-between;
                    width: 100%;

                    button {
                        width: 30px;
                        height: 30px;
                        border-radius: 50%;
                        background: rgba(0.5,0.5,0.5,0.4);
                        color: #fff;
                        cursor: pointer;
                        outline: none;
                        font-size: 1.4rem;
                        &:hover {
                            border: 1px solid #fff;
                        }
                    }
                }
            }
            .button {
                width: 35%;
                button {
                    width: 100%;
                    padding: 0.5rem 1rem;
                    border-radius: 15px;
                    cursor: pointer;
                    background: rgba(0.5, 0.5, 0.5, 0.4);
                    border: none;
                    color: #fff;
                    font-size: 1.4rem;
                    &:hover {
                        border: 1px solid #fff;
                    }
                }
            }
        }
    }
</style>