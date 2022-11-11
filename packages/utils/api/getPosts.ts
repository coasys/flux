import { Post } from "../types";
import { GetEntries } from "../types";
import getEntries from "./getEntries";
import { DEFAULT_LIMIT, forumFilteredQuery, forumQuery } from "../constants/sdna";

export default async function getPosts(perspectiveUuid: string, source: string, fromDate?: Date): Promise<Post[]> {
    console.log("GETTING POSTS");
    let prologQuery;
    if (fromDate) {
        prologQuery = forumFilteredQuery;
    } else {
        prologQuery = forumQuery
    }
    
    const getEntriesInput = {
        perspectiveUuid,
        queries: [{
            query: prologQuery,
            arguments: [DEFAULT_LIMIT, source, fromDate?.getTime()],
            resultKeys: ["Id", "Timestamp", "Author", "Titles", "Bodys", "Reactions", "Replies", "IsPopular"]
        }],
    } as GetEntries;
    const entries = await getEntries(getEntriesInput);
    const posts = [] as Post[];

    for (const entry of entries) {
        const post = entry as Post;
        post.reactions = entry.data?.Reactions;
        post.titles = entry.data?.Titles;
        post.bodys = entry.data?.Bodys;
        post.isPopular = entry.data?.IsPopular;
        posts.push(post);
    }
    console.log("Getting posts", posts);
    return posts;
}