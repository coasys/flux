import { ref, Ref, onMounted } from "vue";
import {SubjectRepository} from 'utils/factory'
import { PerspectiveProxy } from "@perspect3vism/ad4m";
import {getAd4mClient} from '@perspect3vism/ad4m-connect'

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  model: 
};

export default function useEntries({ perspective, source, model }: Props) {

 const Model = new SubjectRepository(model as any, {
      perspectiveUuid: perspective.uuid,
      source: source || undefined,
    });

  const entries = ref<Record<string, any>[]>([]);

  const getEntries = async () => {
    entries.value = await Model.getAllData();
  };

  onMounted(() => {
    getEntries();
  })
  
  return { entries, model: Model };
}


