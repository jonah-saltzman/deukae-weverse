import {v2} from '@google-cloud/translate'
import dotenv from 'dotenv'
import { TweetV1, TwitterApi } from 'twitter-api-v2'
import { WeverseClient } from "weverse"
import { WeversePost } from 'weverse/lib/cjs/models'
import { string, downloadImg, emoji, memberHash, footer } from "./helpers/index.js"
dotenv.config()
import { PythonShell } from 'python-shell'
import path from 'path'
import { fileURLToPath } from "url"
import { getIgPosts } from './ig/index.js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

enum IG {
    JIU = 'minjiu__u',
    SUA = 'sualelbora',
    SIYEON = '______s2ing',
    HANDONG = '0.0_handong',
    YOOH = 'ms.yoohyeonkim',
    DAMI = '00ld_ami',
    GAH = 'fox._.zzlo_'
}

const IgUsers = [IG.JIU, IG.SUA, IG.SIYEON, IG.HANDONG, IG.YOOH, IG.DAMI, IG.GAH]

async function translateText() {
    await getIgPosts()
}

function sameDay(d: Date): WeversePost | undefined {
    return myClient.posts.find(p => {
        return p.createdAt.getFullYear() !== d.getFullYear()
               && p.createdAt.getMonth() === d.getMonth()
               && p.createdAt.getDate() === d.getDate()
      })
}

async function handlePost(post: WeversePost, otd: boolean) {
    try {
        const today = post.createdAt
        const body = post.body
            ? emoji(post.artist.id) + ': ' + post.body + '\n\n'
            : emoji(post.artist.id) + '\n\n'
        const tweetText = body + memberHash(post.artist.id) + '\n'
        const date = today.getFullYear().toString().substring(2)
                     + (today.getMonth() + 1).toString().padStart(2, '0')
                     + today.getDate().toString().padStart(2, '0')
        const prefix = otd ? `[ON THIS DAY ${date}]\n` : `[${date}]\n`
        let tweet: TweetV1 | undefined
        let medias: string[] | undefined
        console.log(prefix + tweetText + footer)
        if (post.photos && post.photos.length) {
            // const photos = await Promise.all(post.photos.map(p => downloadImg(p.orgImgUrl)))
            // medias = await Promise.all(photos.map(p => {
            //     return Twitter.v1.uploadMedia(p.buffer, { type: p.ext })
            // }))
            // tweet = await Twitter.v1.tweet(prefix + tweetText + footer, { media_ids: medias })
            // console.log(tweet)
            // tweets.set(post.id, tweet)
            // savedTweets.push({postId: post.id, tweet: tweet})
        } else if (post.attachedVideos) {
            // const videos = await Promise.all(post.attachedVideos.map(v => downloadImg(v.videoUrl)))
            // medias = await Promise.all(videos.map(v => {
            //     return Twitter.v1.uploadMedia(v.buffer, { type: v.ext })
            // }))
            // tweet = await Twitter.v1.tweet(prefix + tweetText + footer, { media_ids: medias })
            // console.log(tweet)
            // tweets.set(post.id, tweet)
            // savedTweets.push({postId: post.id, tweet: tweet})
        } else {
            // tweet = await Twitter.v1.tweet(prefix + tweetText + footer)
            // console.log(tweet)
            // tweets.set(post.id, tweet)
            // savedTweets.push({postId: post.id, tweet: tweet})
        }
        if (tweet && post.body) {
            // replyWithTrans(post.body, post.artist.id, tweet, medias)
        }
    } catch(e) {
        console.error(e)
        // postBacklog.push(post.id)
    } finally {
        // saveBacklog()
        // saveTweets()
    }
}

translateText();