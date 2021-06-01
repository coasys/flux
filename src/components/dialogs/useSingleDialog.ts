import {reactive} from 'vue'

const state = reactive<{
  visible: boolean,
  message: string | null
}>({
  visible: false,
  message: null
});

const useSingleDialog = () => {
  function show(message: string) {
    state.visible = true;
    state.message = message;
  }

  function hide() {
    state.visible = false;
    state.message = null;
  }

return {state, show, hide}
}

export default useSingleDialog;