import { Post } from "../types";
import { GetEntries } from "../types";
import getEntries from "./getEntries";
import { DEFAULT_LIMIT, forumFilteredQuery, forumQuery } from "../constants/sdna";
import { Literal } from "@perspect3vism/ad4m";

function cleanPostData(prologEntry: any) {
    const post = prologEntry as Post;
    
    //Clean up the emoji string
    prologEntry.data?.Reactions.forEach((reaction: any) => {
        reaction.content = reaction.content.replace("emoji://");
    });
    post.reactions = prologEntry.data?.Reactions;

    //Clean up the titles and bodys
    prologEntry.data?.Titles.forEach((title: any) => {
        console.log(title);
        console.log(Literal.fromUrl(title.content).get().data);
        title.content = Literal.fromUrl(title.content).get().data;
    });
    post.titles = prologEntry.data?.Titles;
    prologEntry.data?.Bodys.forEach((body: any) => {
        body.content = Literal.fromUrl(body.content).get().data;
    });
    post.bodys = prologEntry.data?.Bodys;
    post.isPopular = prologEntry.data?.IsPopular;

    //Clean up the replies
    prologEntry.data?.Replies.forEach((reply: any) => {
        cleanPostData(reply);
    });
    post.replies = prologEntry.data?.Replies;
    return post;
}

export default async function getPosts(perspectiveUuid: string, source: string, fromDate?: Date): Promise<Post[]> {
    console.warn("Getting posts...");
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
        posts.push(cleanPostData(entry));
    }
    console.log("Getting posts", posts);
    return posts;
}