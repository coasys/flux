import { useEffect, useState, useRef } from "preact/hooks";
import { Agent, PerspectiveProxy } from "@coasys/ad4m";
import styles from "./SynergyDemoView.module.css";
import { usePrevious } from "../../utils";
import { AgentClient } from "@coasys/ad4m/lib/src/agent/AgentClient";

type Props = {
  perspective: PerspectiveProxy;
  source: string;
  agent: AgentClient;
};

export default function SynergyDemoView({
  perspective,
  agent,
  source: initialSource,
}: Props) {
  const [history, setHistory] = useState([initialSource]);
  const prevHistory = usePrevious(history);
  const [classes, setClasses] = useState<string[]>([]);
  const [me, setMe] = useState<Agent | null>(null);
  const layoutRef = useRef();

  useEffect(() => {
    agent.me().then(setMe);
  }, []);

  useEffect(() => {
    setHistory([initialSource]);
  }, [initialSource, perspective.uuid]);

  useEffect(() => {
    perspective.infer(`subject_class(ClassName, C)`).then((result) => {
      if (Array.isArray(result)) {
        const uniqueClasses = [...new Set(result.map((c) => c.ClassName))];
        setClasses(uniqueClasses);
      } else {
        setClasses([]);
      }
    });
  }, [perspective.uuid]);

  return (
    <>
      <div ref={layoutRef} className={styles.layout}>
      </div>
    </>
  );
}