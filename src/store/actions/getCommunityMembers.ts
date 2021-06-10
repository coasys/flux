import { getExpression } from "@/core/queries/getExpression";
import { getLinks } from "@/core/queries/getLinks";
import { TimeoutCache } from "@/utils/timeoutCache";
import { Commit } from "vuex";
import { ExpressionTypes, Profile, State } from "..";

export interface Context {
  commit: Commit;
  state: State;
}

export interface Payload {
  communityId: string;
}

export function toProfile(did: string, obj: {[x:string]: any}): Profile {
  const profile: Profile = {
    username: obj['foaf:AccountName'],
    email: obj['schema:email'],
    familyName: obj['schema:familyName'],
    givenName: obj['schema:givenName'],
    thumbnailPicture: undefined,
    profilePicture: undefined,
    address: did
  };

  if(obj['schema:image']) {
    profile.profilePicture = obj['schema:image']['schema:contentUrl'];
    profile.thumbnailPicture = obj['schema:image']['schema:thumbnail']['schema:contentUrl'];
  }

  return profile;
}

export async function getMember(profileLangAddress: string, did: string): Promise<Profile> {
  const profileLink = `${profileLangAddress}://${did}`;

  const profileExp = await getExpression(profileLink);

  const profile = JSON.parse(profileExp['data']!).profile;

  if (profile['schema:image']) {
    profile['schema:image'] = JSON.parse(profile['schema:image']);
  }

  return toProfile(did, profile);
}

export default async function(
  { commit , state} : Context,
  { communityId } : Payload,
) : Promise<void> {
  commit('setActiveCommunityMembers', {
    members: [],
  });

  const profiles : {[x: string]: Profile} = {}

  const cache = new TimeoutCache<Profile>(1000 * 60 * 60);

  try {
    const communities = state.communities;

    console.log(communityId, communities);
  
    const community = communities.find(c => c.perspective === communityId);
  
    const profileLinks = await getLinks(communityId, `${community?.linkLanguageAddress}://self`, 'sioc://has_member');
  
    console.log('profileLinks:', profileLinks)
  
    const profileLang = community?.typedExpressionLanguages.find(t => t.expressionType === ExpressionTypes.ProfileExpression);
  
    if (profileLang) {
      for (const profileLink of profileLinks) {
        const did = `${profileLang.languageAddress}://${profileLink.author!.did!}`;
        const profile = cache.get(did);

        if (profile) {
          if (profiles[did] === undefined) {
            profiles[did] = profile;
          }
        } else {
          const member = await getMember(profileLang.languageAddress, profileLink.author!.did!);;
          profiles[did] = member;
          cache.set(did, member);
        }
      }

      const profileList = Object.values(profiles);

      console.log('profiles', profileList);

      commit('setActiveCommunityMembers', {
        members: profileList,
      });
    } else {
      const errorMessage = "Expected to find profile expression language for this community";
      commit("showDangerToast", {
        message: errorMessage,
      });
      throw Error(errorMessage);
    }
  } catch (e) {
    commit("showDangerToast", {
      message: e.message,
    });
    throw new Error(e);
  }
}