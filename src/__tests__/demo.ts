import '@testing-library/vue';
import Store from '../store';

describe('Demo test', () => {  
  test('Demo test - 1', async () => {
    const store = Store;
    console.log("store.state", store.state);
  });
});