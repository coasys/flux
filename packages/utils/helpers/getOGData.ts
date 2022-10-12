// Forked from here: https://github.com/purphoros/fetch-opengraph
import { decode } from 'html-entities';

export const metaTags: any = {
  title: 'title',
  description: 'description',
  ogUrl: 'og:url',
  ogType: 'og:type',
  ogTitle: 'og:title',
  ogDescription: 'og:description',
  ogImage: 'og:image',
  ogVideo: 'og:video',
  ogVideoType: 'og:video:type',
  ogVideoWidth: 'og:video:width',
  ogVideoHeight: 'og:video:height',
  ogVideoUrl: 'og:video:url',
  twitterPlayer: 'twitter:player',
  twitterPlayerWidth: 'twitter:player:width',
  twitterPlayerHeight: 'twitter:player:height',
  twitterPlayerStream: 'twitter:player:stream',
  twitterCard: 'twitter:card',
  twitterDomain: 'twitter:domain',
  twitterUrl: 'twitter:url',
  twitterTitle: 'twitter:title',
  twitterDescription: 'twitter:description',
  twitterImage: 'twitter:image'
};

export const fetch = async (url, html: string): Promise<any> => {
  const {
    title,
    description,
    ogUrl,
    ogType,
    ogTitle,
    ogDescription,
    ogImage,
    ogVideo,
    ogVideoType,
    ogVideoWidth,
    ogVideoHeight,
    ogVideoUrl,
    twitterPlayer,
    twitterPlayerWidth,
    twitterPlayerHeight,
    twitterPlayerStream,
    twitterCard,
    twitterDomain,
    twitterUrl,
    twitterTitle,
    twitterDescription,
    twitterImage
  } = metaTags;

  return new Promise(async (resolve, reject) => {
    try {
      let siteTitle = '';

      const tagTitle = html.match(
        /<title[^>]*>[\r\n\t\s]*([^<]+)[\r\n\t\s]*<\/title>/gim
      );
      siteTitle = tagTitle[0].replace(
        /<title[^>]*>[\r\n\t\s]*([^<]+)[\r\n\t\s]*<\/title>/gim,
        '$1'
      );

      const og = [];
      const metas: any = html.match(/<meta[^>]+>/gim);

      // There is no else statement
      /* istanbul ignore else */
      if (metas) {
        for (let meta of metas) {
          meta = meta.replace(/\s*\/?>$/, " />");
          const zname = meta.replace(/[\s\S]*(property|name)\s*=\s*([\s\S]+)/, "$2");
          const name = /^["']/.test(zname) ? zname.substr(1, zname.slice(1).indexOf(zname[0])) : zname.substr(0, zname.search(/[\s\t]/g))
          const valid = !!Object.keys(metaTags).filter((m: any) => metaTags[m].toLowerCase() === name.toLowerCase()).length;
          // There is no else statement
          /* istanbul ignore else */
          if (valid) {
            const zcontent = meta.replace(/[\s\S]*(content)\s*=\s*([\s\S]+)/, "$2");
            const content = /^["']/.test(zcontent) ? zcontent.substr(1, zcontent.slice(1).indexOf(zcontent[0])) : zcontent.substr(0, zcontent.search(/[\s\t]/g))
            og.push({ name, value: content !== 'undefined' ? content : null });
          }
        }
      }

      const result: any = og.reduce(
        (chain: any, meta: any) => ({ ...chain, [meta.name]: decode(meta.value) }),
        {
          url,
        }
      );

      // Image
      result[ogImage] = result[ogImage] ? result[ogImage] : null;

      result[twitterImage] = result[twitterImage]
        ? result[twitterImage]
        : result[ogImage];

      result.image = result[ogImage]
        ? result[ogImage]
        : null;

      // Video
      result.video = result[ogVideo] ? result[ogVideo] : result[ogVideoUrl] ? result[ogVideoUrl] : null;
      if (result.video) {
        result[ogVideoWidth]  = result[ogVideoWidth]  ? result[ogVideoWidth]  : 560;
        result[ogVideoHeight] = result[ogVideoHeight] ? result[ogVideoHeight] : 340;
      }

      // URL
      result[ogUrl] = result[ogUrl] ? result[ogUrl] : url;

      result[twitterUrl] = result[twitterUrl]
        ? result[twitterUrl]
        : result[ogUrl];

      result.url = url;

      // Description
      result[ogDescription] = result[ogDescription]
        ? result[ogDescription]
        : result.description;

      result[twitterDescription] = result[twitterDescription]
        ? result[twitterDescription]
        : result[ogDescription];

      result.description = result[ogDescription];

      // Title
      result[ogTitle] = result[ogTitle] ? result[ogTitle] : siteTitle;

      result[twitterTitle] = result[twitterTitle]
        ? result[twitterTitle]
        : result[ogTitle];

      result.title = result[ogTitle];

      // Type
      result[ogType] = result[ogType] ? result[ogType] : 'website';

      return resolve(result);
    } catch (error: any) {
      return reject({
        message: error.message,
        status: error.status || 400,
        error,
        [title]: "",
        [description]: "",
        [ogUrl]: url,
        [ogType]: "website",
        [ogTitle]: "",
        [ogDescription]: "",
        [ogImage]: "",
        [twitterCard]: "",
        [twitterDomain]: "",
        [twitterUrl]: url,
        [twitterTitle]: "",
        [twitterDescription]: "",
        [twitterImage]: ""
      });
    }
  });
};

export default fetch