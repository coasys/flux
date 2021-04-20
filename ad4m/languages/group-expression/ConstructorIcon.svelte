<svelte:options tag={null}/>

<script lang="ts">
export let commitExpression

let expData = {
    name: "",
    description: ""
};
</script>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@simonwep/pickr/dist/themes/nano.min.css"/> <!-- 'nano' theme -->

<div class="container" id="exp_container" style="--theme-color: {colour}">
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