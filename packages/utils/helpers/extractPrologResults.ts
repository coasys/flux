export default function extractPrologResults(prologResults: any, values: string[]): any | null {
    if (prologResults === null) {
        return null;
    }
    if (!Array.isArray(prologResults)) {
        prologResults = [prologResults];
    }
    
    const results = [] as any[];

    for (const prologResult of prologResults) {
        const result = {};
        for (const value of values) {
            const prologResultValue = prologResult[value];
            if (!prologResultValue.head) {
                if (prologResultValue != "[]") {
                    result[value] = prologResultValue;
                } else {
                    result[value] = [];
                }
            } else {
                const temp = [] as any[];
                const prologResultValueHead = prologResultValue.head;
                let prologResultValueTail = prologResultValue.tail;
                temp.push({
                    content: prologResultValueHead.args[0],
                    timestamp: new Date(prologResultValueHead.args[1].args[0]),
                    author: prologResultValueHead.args[1].args[1],
                });
                while (typeof prologResultValueTail !== "string") {
                    temp.push({
                        content: prologResultValueTail.head.args[0],
                        timestamp: new Date(prologResultValueTail.head.args[1].args[0]),
                        author: prologResultValueTail.head.args[1].args[1],
                    });
                    prologResultValueTail = prologResultValueTail.tail;
                }
                result[value] = temp;
            }
        }
        results.push(result);
    }
    return results;
}