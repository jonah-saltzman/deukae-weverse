import { WeverseClient } from "weverse"
import { TweetV1, TwitterApi } from 'twitter-api-v2'
import { string, downloadImg, emoji, memberHash, footer } from "./helpers/index.js"
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import {v2} from '@google-cloud/translate'

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

async function run() {
    testTrans()
    loadTweets()
    await Weverse.init({allPosts: false, allMedia: false, allNotifications: false})
    Weverse.listen({listen: true, interval: 5000, process: true})
    Weverse.on('post', async post => {
        try {
            const body = post.body
                ? emoji(post.artist.id) + ': ' + post.body + '\n\n'
                : emoji(post.artist.id) + '\n\n'
            const tweetText = body + memberHash(post.artist.id) + '\n'
            let tweet: TweetV1 | undefined
            if (post.photos && post.photos.length) {
                const photos = await Promise.all(post.photos.map(p => downloadImg(p.orgImgUrl)))
                const mediaIds = await Promise.all(photos.map(p => {
                    return Twitter.v1.uploadMedia(p.buffer, { type: p.ext })
                }))
                tweet = await Twitter.v1.tweet(tweetText + footer, { media_ids: mediaIds })
                console.log(tweet)
                tweets.set(post.id, tweet)
                savedTweets.push({postId: post.id, tweet: tweet})
                saveTweets()
            } else if (post.attachedVideos) {
                const videos = await Promise.all(post.attachedVideos.map(v => downloadImg(v.videoUrl)))
                const mediaIds = await Promise.all(videos.map(v => {
                    return Twitter.v1.uploadMedia(v.buffer, { type: v.ext })
                }))
                tweet = await Twitter.v1.tweet(tweetText + footer, { media_ids: mediaIds })
                console.log(tweet)
                tweets.set(post.id, tweet)
                savedTweets.push({postId: post.id, tweet: tweet})
                saveTweets()
            } else {
                tweet = await Twitter.v1.tweet(tweetText + footer)
                console.log(tweet)
                tweets.set(post.id, tweet)
                savedTweets.push({postId: post.id, tweet: tweet})
                saveTweets()
            }
            if (tweet && post.body) {
                replyWithTrans(post.body, post.artist.id, tweet)
            }
        } catch(e) {
            console.error(e)
        }
    })
    Weverse.on('comment', async (comment, post) => {
        const tweetText = emoji(comment.artist.id) + ': ' + comment.body + '\n' + memberHash(comment.artist.id) + '\n'
        const replyTo = tweets.get(post.id)
        if (replyTo) {
            const withQuote = tweetText + twtPrefix + replyTo.id.toString() + '\n'
            const tweet = await Twitter.v1.tweet(withQuote + footer)
            replyWithTrans(comment.body, comment.artist.id, tweet)
            console.log(tweet)
        }
    })
    Weverse.on('poll', status => {
        console.log('Polled Weverse: ', status, new Date().toLocaleString())
    })
}

function saveTweets() {
    const data = JSON.stringify(savedTweets, null, 2)
    fs.writeFileSync(path.join(__dirname, '/tweets/tweets.json'), data, 'utf-8')
}

function loadTweets() {
    const data = fs.readFileSync(path.join(__dirname, '/tweets/tweets.json'), 'utf-8')
    const array = JSON.parse(data) as SaveTweet[]
    array.forEach(saved => {
        tweets.set(saved.postId, saved.tweet)
        savedTweets.push(saved)
    })
}

async function replyWithTrans(text: string, artist: number, tweet: TweetV1) {
    try {
        const translations = await Google.translate(text, 'en')
        const tweetText = '[TRANS]\n' + emoji(artist) + ': ' + translations[0] + '\n\n' + memberHash(artist) + '\n'
        await Twitter.v1.reply(tweetText + footer, tweet.id_str)
    } catch (e) {
        console.error(e)
    }
}

async function testTrans() {
    const r = await Google.translate('뀨우😚\n썸냐들 정말 봄이 왔나봐요ㅠㅠㅠㅠㅠ🌸좋다ㅠㅠ', 'en')
    console.log(r[0])
}

run()