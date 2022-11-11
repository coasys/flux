//usage: format("Hello %%! I ate %% apples today.", "World", 44);
//@ts-ignore
export default function format(fmt, ...args){
    return fmt
        .split("%%")
        .reduce((aggregate, chunk, i) =>
            aggregate + chunk + (args[i] || ""), "");
}