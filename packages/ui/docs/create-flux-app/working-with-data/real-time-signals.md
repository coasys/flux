# Real-time Signals

For data that doesn't need to be stored on the DHT, signals can be used to send real-time messages.

To send a real-time signal to the network:

::: code-group

```typescript
import { NeighbourhoodProxy } from "@perspect3vism/ad4m";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/utils";

const client = await getAd4mClient();
const neighbourhood = new NeighbourhoodProxy(client.neighbourhood, "1234");

// Send a signal to the network
neighbourhood.sendBroadcastU({ links: [] });
```
