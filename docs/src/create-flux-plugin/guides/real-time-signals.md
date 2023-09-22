# Real-time Signals

For data that doesn't need to be stored on the DHT, signals can be used to send real-time messages.

An AD4M neighbourhood exposes `sendBroadcast` and `sendSignal` functions. A broadcast is sent to every listener in the neighbourhood, whilst a signal is sent to a single recipient.

Let's first create our own reusable React hook for neighbourhoods:

```tsx
function useNeighbourhood(perspective, { onSignal }) {
  const neighbourhood = useMemo(
    () => perspective.getNeighbourhoodProxy(),
    [perspective.uuid]
  );

  useEffect(() => {
    neighbourhood.addSignalHandler(onSignal);
    return neighbourhood.removeSignalHandler(onSignal);
  }, [perspective.uuid]);

  return neighbourhood;
}
```

## Broadcasts

To send and recieve a real-time signal in the neighbourhood:

```tsx [example]
import useNeighbourhood from "./useNeighbourhood";

export default function SignalApp({ perspective, source }) {
  const neighbourhood = useNeighbourhood(perspective, {
    onSignal: (expression: PerspectiveExpression) => {
      // Handle the signal
    },
  });

  function sendBroadcast() {
    // Send a signal to the network
    neighbourhood.sendBroadcastU({ links: [] });
  }

  return <button onClick={sendBroadcast}>Broadcast to Neighbourhood</button>;
}
```

## Signals

To send and recieve a real-time signal to a recipient:

```tsx [example]
import useNeighbourhood from "./useNeighbourhood";

export default function SignalApp({ perspective, source }) {
  const neighbourhood = useNeighbourhood(perspective, {
    onSignal: (expression: PerspectiveExpression) => {
      // Handle the signal
    },
  });

  function sendSignal() {
    // Send a signal to the network
    neighbourhood.sendSignalU("recipientDID", { links: [] });
  }

  return <button onClick={sendSignal}>Send signal to an Agent</button>;
}
```

The broadcast handler will also receive signals. If you need to determine if the signal was sent as a broadcast or a signal to a single peer you can check the expression.
