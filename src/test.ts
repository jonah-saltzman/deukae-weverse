import {v2} from '@google-cloud/translate'
import dotenv from 'dotenv'
import { TweetV1, TwitterApi } from 'twitter-api-v2'
import { WeverseClient } from "weverse"
import { WeversePost } from 'weverse/lib/cjs/models'
import { string, downloadImg, emoji, memberHash, footer } from "./helpers/index.js"
dotenv.config()

const twtKey = string(process.env.TWT_CONSUMER_KEY)
const twtSecret = string(process.env.TWT_CONSUMER_SECRET)
const oauthToken = string(process.env.TWT_OAUTH_TOKEN)
const oauthSecret = string(process.env.TWT_OAUTH_SECRET)
const wvToken = string(process.env.WV_TOKEN)

const { Translate } = v2

const twtPrefix = 'https://twitter.com/DeukaeWeverse/status/'
const twtId = '1513188328019054596'

const Twitter = new TwitterApi({
    appKey: twtKey,
    appSecret: twtSecret,
    accessToken: oauthToken,
    accessSecret: oauthSecret
}).readWrite

const myClient = new WeverseClient({token: wvToken}, true)

async function translateText() {
  await myClient.init({allMedia: false, allNotifications: false, allPosts: false})
  console.log(myClient.authType)
  console.log(myClient.authorized)
  const post = (await myClient.getPost(1689272222511067, 14))
  if (post) {
    handlePost(post)
  }
}

async function handlePost(post: WeversePost) {
  try {
      const body = post.body
          ? emoji(post.artist.id) + ': ' + post.body + '\n\n'
          : emoji(post.artist.id) + '\n\n'
      const tweetText = body + memberHash(post.artist.id) + '\n'
      let tweet: TweetV1 | undefined
      let medias: string[] | undefined
      if (post.photos && post.photos.length) {
          post.photos.forEach(p => console.log(p.orgImgUrl))
          //const photos = await Promise.all(post.photos.map(p => downloadImg(p.orgImgUrl)))
          //console.log(photos)
          // medias = await Promise.all(photos.map(p => {
          //     return Twitter.v1.uploadMedia(p.buffer, { type: p.ext })
          // }))
          // tweet = await Twitter.v1.tweet(tweetText + footer, { media_ids: medias })
          // console.log(tweet)
          // tweets.set(post.id, tweet)
          // savedTweets.push({postId: post.id, tweet: tweet})
          // saveTweets()
      } else if (post.attachedVideos) {
          const videos = await Promise.all(post.attachedVideos.map(v => downloadImg(v.videoUrl)))
          medias = await Promise.all(videos.map(v => {
              return Twitter.v1.uploadMedia(v.buffer, { type: v.ext })
          }))
          // tweet = await Twitter.v1.tweet(tweetText + footer, { media_ids: medias })
          // console.log(tweet)
          // tweets.set(post.id, tweet)
          // savedTweets.push({postId: post.id, tweet: tweet})
          // saveTweets()
      } else {
          // tweet = await Twitter.v1.tweet(tweetText + footer)
          // console.log(tweet)
          // tweets.set(post.id, tweet)
          // savedTweets.push({postId: post.id, tweet: tweet})
          // saveTweets()
      }
      if (tweet && post.body) {
          // replyWithTrans(post.body, post.artist.id, tweet, medias)
      }
  } catch(e) {
      console.error(e)
  }
}

translateText();