import { WeverseClient } from "weverse"
import { SendTweetV1Params, TweetV1, TwitterApi } from 'twitter-api-v2'
import { string, downloadImg, emoji, memberHash, footer } from "./helpers/index.js"
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import {v2} from '@google-cloud/translate'
import { getIgPosts } from './ig/index.js'

type SaveTweet = {
    postId: number,
    tweet: TweetV1
}

dotenv.config()
const wvToken = string(process.env.WV_TOKEN)
const twtKey = string(process.env.TWT_CONSUMER_KEY)
const twtSecret = string(process.env.TWT_CONSUMER_SECRET)
const oauthToken = string(process.env.TWT_OAUTH_TOKEN)
const oauthSecret = string(process.env.TWT_OAUTH_SECRET)

const { Translate } = v2

import { fileURLToPath } from "url"
import { WeversePost } from "weverse/lib/cjs/models"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const Twitter = new TwitterApi({
    appKey: twtKey,
    appSecret: twtSecret,
    accessToken: oauthToken,
    accessSecret: oauthSecret
}).readWrite

const Google = new Translate({
    projectId: 'dc-weverse',
    keyFilename: './src/dc-weverse-9c6f63ca3f16.json'
})

const Weverse = new WeverseClient({token: wvToken}, true)

const tweets = new Map<number, TweetV1>()
const savedTweets: SaveTweet[] = []
const twtPrefix = 'https://twitter.com/DeukaeWeverse/status/'
const postBacklog: number[] = []

const text = "오늘의 일기☔️\n\n오늘 갑자기 날씨가 추워졌다\n난 티셔츠 한 장만 입었지만 차안 아니면 실내에 있어서 춥지 않았다\n하지만 우릴 기다리는 썸냐들은\n비도 오는데 밖에 있었다 ㅠㅠ\n감기 걸리진 않을까 걱정이 된다\n모두가 아프지 않았으면\n좋겠다♥️ \n      그리고…\n다들 메종(집) 잘 들어가쪄???\n 푹자용♥️"

// async function run() {
//     handlePost(text, new Date(), 61)
// }

const LIMIT = 130

async function thread(text: string, media?: string[]): Promise<TweetV1[] | undefined> {
    try {
        const tweet = await Twitter.v1.tweet(text, { media_ids: media })
        return [tweet]
    } catch {
        const n = Math.ceil(text.length / LIMIT)
        let pages: string[] = []
        for (let i = 0; i < n; i++) {
            pages.push(text.slice(i * LIMIT, (i + 1) * LIMIT).trim())
            if (i < n - 1) {
                pages.push(`…[${i + 1}/${n}]&&…`)
            }
        }
        const str = pages.join('')
        pages = str.split('&&')
        const params: SendTweetV1Params[] = pages.map(text => ({ status: text }))
        params[params.length - 1].media_ids = media
        try {
            const tweets = await Twitter.v1.tweetThread(params)
            return tweets
        } catch {
            return undefined
        }
    }
}

// async function handlePost(text: string, created: Date, id: number) {
//     try {
//         const suffix = footer
//         const today = created
//         const body = text
//             ? emoji(id) + ': ' + text + '\n\n'
//             : emoji(id) + '\n\n'
//         const tweetText = body + memberHash(id) + '\n'
//         const date = today.getFullYear().toString().substring(2)
//                      + (today.getMonth() + 1).toString().padStart(2, '0')
//                      + today.getDate().toString()
//         const prefix = `[${date}]\n`
//         let tweets: string[]
//         let medias: string[] | undefined
//         tweets = await thread(prefix + tweetText + suffix)
//         tweets.forEach(t => {
//             console.log(t)
//             console.log(`len: ${t.length}`)
//         })
//         // if (tweet && post.body) {
//         //     replyWithTrans(post.body, post.artist.id, tweet, medias, trim)
//         // }
//     } catch(e) {
//         // const err = e as any
//         // console.error(e)
//         // if (err.code === 403 && !trim) {
//         //     await handlePost(post, otd, true)
//         //     return
//         // }
//         // postBacklog.push(post.id)
//     } finally {
//         // saveBacklog()
//         // saveTweets()
//     }
// }

// async function replyWithTrans(text: string, artist: number, tweet: TweetV1, media?: string[], trim?: boolean) {
//     trim = (trim === undefined || trim === false) ? false : true
//     const suffix = trim ? '' : footer
//     try {
//         const translations = await Google.translate(text, 'en')
//         const tweetText = '[TRANS]\n' + emoji(artist) + ': ' + translations[0] + '\n\n' + memberHash(artist) + '\n'
//         await Twitter.v1.reply(tweetText + suffix, tweet.id_str, {media_ids: media})
//     } catch (e) {
//         console.error(e)
//     }
// }

// function saveTweets() {
//     const data = JSON.stringify(savedTweets, null, 2)
//     fs.writeFileSync(path.join(__dirname, '/tweets/tweets.json'), data, 'utf-8')
// }

// function loadTweets() {
//     const data = fs.readFileSync(path.join(__dirname, '/tweets/tweets.json'), 'utf-8')
//     const array = JSON.parse(data) as SaveTweet[]
//     array.forEach(saved => {
//         tweets.set(saved.postId, saved.tweet)
//         savedTweets.push(saved)
//     })
//     console.log(`loaded ${array.length} tweets from json`)
// }

// async function testTrans() {
//     const r = await Google.translate('뀨우😚\n썸냐들 정말 봄이 왔나봐요ㅠㅠㅠㅠㅠ🌸좋다ㅠㅠ', 'en')
//     console.log(r[0])
// }

// async function backlog() {
//     const postIds = JSON.parse(fs.readFileSync(path.join(__dirname, '/tweets/backlog.json'), 'utf-8')) as number[]
//     console.log('backlog:', postIds)
//     postIds.forEach(async id => {
//         const post = await Weverse.getPost(id, 14)
//         console.log('backlog post:')
//         console.log(post)
//         if (post) {
//             handlePost(post, false, false)
//         }
//     })
// }

// async function onThisDay() {
//     const today = new Date()
//     const post = sameDay(today)
//     if (post) {
//         if (!tweets.has(post.id)) {
//             handlePost(post, true, false)
//         }
//     }
// }

// function sameDay(d: Date): WeversePost | undefined {
//     return Weverse.posts.find(p => {
//         return p.createdAt.getFullYear() !== d.getFullYear()
//                && p.createdAt.getMonth() === d.getMonth()
//                && p.createdAt.getDate() === d.getDate()
//       })
// }

// function saveBacklog() {
//     const data = JSON.stringify(postBacklog, null, 2)
//     fs.writeFileSync(path.join(__dirname, '/tweets/backlog.json'), data, 'utf-8')
// }