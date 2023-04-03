# Real-time Signals

For data that doesn't need to be stored on the DHT, signals can be used to send real-time messages.

An AD4M neighbourhood exposes `sendBroadcast` and `sendSignal` functions. A broadcast is sent to every listener in the neighbourhood, whilst a signal is sent to a single recipient.

## Broadcasts

### Sending

To send a real-time signal to the neighbourhood:

::: code-group

```typescript
import { NeighbourhoodProxy } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const client = await getAd4mClient();
const neighbourhood = new NeighbourhoodProxy(client.neighbourhood, "1234");

// Send a signal to the network
neighbourhood.sendBroadcastU({ links: [] });
```

### Receiving

To listen for incoming signals, add a handler to the neighbourhood.

::: code-group

```typescript
import { NeighbourhoodProxy, PerspectiveExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const client = await getAd4mClient();
const neighbourhood = new NeighbourhoodProxy(client.neighbourhood, "1234");

const handleSignal = async (expression: PerspectiveExpression) => {
  // Do something
};

neighbourhood.addSignalHandler(handleSignal);
```

## Signals

### Sending

To send a real-time signal to a recipient:

::: code-group

```typescript
import { NeighbourhoodProxy } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const client = await getAd4mClient();
const neighbourhood = new NeighbourhoodProxy(client.neighbourhood, "1234");

// Send a signal to the network
neighbourhood.sendSignalU("recipientDID", { links: [] });
```

### Receiving

The broadcast handler will also receive signals. If you need to determine if the signal was sent as a broadcast or a signal to a single peer you can check the expression.

::: code-group

```typescript
import { NeighbourhoodProxy, PerspectiveExpression } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const client = await getAd4mClient();
const neighbourhood = new NeighbourhoodProxy(client.neighbourhood, "1234");

const handleSignal = async (expression: PerspectiveExpression) => {
  // Do something
};

neighbourhood.addSignalHandler(handleSignal);
```
