type RetryOptions = {
  defaultValue?: any;
  count?: number;
  sleepDuration?: number;
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function retry(fn: () => any, {
  defaultValue = null, 
  count = 50, 
  sleepDuration = 200
}: RetryOptions) {
  return new Promise(async (resolve, reject) => {
    const timeout = sleepDuration * count;
  
    await sleep(sleepDuration)
  
    try {
      const id = setTimeout(() => {
        resolve(defaultValue);
      }, timeout);
  
      const val = await fn();
  
      clearTimeout(id);
      
      if (!val) {
        if (count > 0) {
          resolve(await retry(fn, { count: count - 1 }));
        }
    
        resolve(defaultValue);
      }
  
      resolve(val);
    } catch (e) {
      if (count > 0) {
        resolve(await retry(fn, { count: count - 1 }));
      }
  
      resolve(defaultValue);
    }
  })
}