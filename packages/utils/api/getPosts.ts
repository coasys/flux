import { Post } from "../types";
import { EntryType, GetEntries } from "../types";
import { TITLE, BODY, REACTION, REPLY_TO } from "../constants/communityPredicates";
import getEntries from "./getEntries";

//TODO; try to recrusively call flux_post and not flux_post_simple to get all the replies
//Todo; add IsPopular result to the query

export function generatePrologQuery(fromDate?: Date): string {
    let query;
    if (fromDate) {
        query = `
            flux_post_simple(Source, Id, Timestamp, Author, Titles, Bodys, Reactions):-
                link(Source, "${EntryType.Forum}", Id, Timestamp, Author),
                findall((Title, TitleTimestamp, TitleAuthor), link(Id, "${TITLE}", Title, TitleTimestamp, TitleAuthor), Titles),
                findall((Body, BodyTimestamp, BodyAuthor), link(Id, "${BODY}", Body, BodyTimestamp, BodyAuthor), Bodys),
                findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Id, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),

            flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies):- 
                link(Source, "${EntryType.Forum}", Id, Timestamp, Author),
                findall((Title, TitleTimestamp, TitleAuthor), link(Id, "${TITLE}", Title, TitleTimestamp, TitleAuthor), Titles),
                findall((Body, BodyTimestamp, BodyAuthor), link(Id, "${BODY}", Body, BodyTimestamp, BodyAuthor), Bodys),
                findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Id, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
                findall((flux_post_simple(Source, Reply, Timestamp, Author, Titles, Bodys, Reactions)), link(Reply, "${REPLY_TO}", Id, ReplyTimestamp, ReplyAuthor), Replies);
            
            flux_post_query_popular(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, true):- 
                flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies), isPopular(Message).
      
            flux_post_query_popular(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, false):- 
                flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies), isNotPopular(Message).    


            limit(%%, (order_by([desc(Timestamp)], flux_post_query_popular("%%", Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, IsPopular)), Timestamp =< %%)).`;
    } else {
        query = `
            flux_post_simple(Source, Id, Timestamp, Author, Titles, Bodys, Reactions):-
                link(Source, "${EntryType.Forum}", Id, Timestamp, Author),
                findall((Title, TitleTimestamp, TitleAuthor), link(Id, "${TITLE}", Title, TitleTimestamp, TitleAuthor), Titles),
                findall((Body, BodyTimestamp, BodyAuthor), link(Id, "${BODY}", Body, BodyTimestamp, BodyAuthor), Bodys),
                findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Id, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),

            flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies):- 
                link(Source, "${EntryType.Forum}", Id, Timestamp, Author),
                findall((Title, TitleTimestamp, TitleAuthor), link(Id, "${TITLE}", Title, TitleTimestamp, TitleAuthor), Titles),
                findall((Body, BodyTimestamp, BodyAuthor), link(Id, "${BODY}", Body, BodyTimestamp, BodyAuthor), Bodys),
                findall((Reaction, ReactionTimestamp, ReactionAuthor), link(Id, "${REACTION}", Reaction, ReactionTimestamp, ReactionAuthor), Reactions),
                findall((flux_post_simple(Source, Reply, Timestamp, Author, Titles, Bodys, Reactions)), link(Reply, "${REPLY_TO}", Id, ReplyTimestamp, ReplyAuthor), Replies);
            
            flux_post_query_popular(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, true):- 
                flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies), isPopular(Message).
      
            flux_post_query_popular(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, false):- 
                flux_post(Source, Id, Timestamp, Author, Titles, Bodys, Reactions, Replies), isNotPopular(Message).    

            limit(%%, order_by([desc(Timestamp)], flux_post_query_popular("%%", Id, Timestamp, Author, Titles, Bodys, Reactions, Replies, IsPopular))).`;
    }
    return query;
}

export default async function getPosts(perspectiveUuid: string, fromDate?: Date): Promise<Post[]> {
    const prologQuery = generatePrologQuery(fromDate);
    const getEntriesInput = {
        perspectiveUuid,
        queries: [{
            query: prologQuery,
            arguments: [50, fromDate?.getTime()]
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
    return posts;
}