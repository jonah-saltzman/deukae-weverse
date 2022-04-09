import { WeverseClient } from "weverse"
import { TweetV1, TwitterApi } from 'twitter-api-v2'
import { string, downloadImg, emoji, memberHash, footer } from "./helpers/index.js"
import dotenv from 'dotenv'
import { WeversePost } from "weverse/lib/cjs/models"
import fs from 'fs'
import path from 'path'

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
const twtBot = string(process.env.TWT_USER)
import { fileURLToPath } from "url"
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const Twitter = new TwitterApi({
    appKey: twtKey,
    appSecret: twtSecret,
    accessToken: oauthToken,
    accessSecret: oauthSecret}).readWrite

const Weverse = new WeverseClient({token: wvToken}, true)

//const posts = new Map<number, WeversePost>()
const tweets = new Map<number, TweetV1>()
const savedTweets: SaveTweet[] = []
const twtPrefix = 'https://twitter.com/DeukaeWeverse/status/'

async function run() {
    loadTweets()
    await Weverse.init({allPosts: false, allMedia: false, allNotifications: false})
    Weverse.listen({listen: true, interval: 5000, process: true})
    Weverse.on('post', async post => {
        try {
            const tweetText = emoji(post.artist.id) + ': ' + post.body + '\n' + memberHash(post.artist.id) + '\n'
            if (post.photos && post.photos.length) {
                const photos = await Promise.all(post.photos.map(p => downloadImg(p.orgImgUrl)))
                const mediaIds = await Promise.all(photos.map(p => {
                    return Twitter.v1.uploadMedia(p.buffer, { type: p.ext })
                }))
                const tweet = await Twitter.v1.tweet(tweetText + footer, { media_ids: mediaIds })
                console.log(tweet)
                tweets.set(post.id, tweet)
                savedTweets.push({postId: post.id, tweet: tweet})
                saveTweets()
            } else if (post.attachedVideos) {
                const videos = await Promise.all(post.attachedVideos.map(v => downloadImg(v.videoUrl)))
                const mediaIds = await Promise.all(videos.map(v => {
                    return Twitter.v1.uploadMedia(v.buffer, { type: v.ext })
                }))
                const tweet = await Twitter.v1.tweet(tweetText + footer, { media_ids: mediaIds })
                console.log(tweet)
                tweets.set(post.id, tweet)
                savedTweets.push({postId: post.id, tweet: tweet})
                saveTweets()
            } else {
                const tweet = await Twitter.v1.tweet(tweetText + footer)
                console.log(tweet)
                tweets.set(post.id, tweet)
                savedTweets.push({postId: post.id, tweet: tweet})
                saveTweets()
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

run()