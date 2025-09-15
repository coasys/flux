import { computed } from "vue";
import { useRoute } from "vue-router";

function getStringParam(param: string | string[] | undefined): string {
  return Array.isArray(param) ? param[0] : param || "";
}

export function useRouteParams() {
  const route = useRoute();

  return {
    communityId: computed(() => getStringParam(route.params.communityId)),
    channelId: computed(() => getStringParam(route.params.channelId)),
    viewId: computed(() => getStringParam(route.params.viewId)),
  };
}
