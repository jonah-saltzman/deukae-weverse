import { WeverseClient } from "weverse"
import { TweetV1, TwitterApi } from 'twitter-api-v2'
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

const version = 1.2

const tweets = new Map<number, TweetV1>()
const savedTweets: SaveTweet[] = []
const twtPrefix = 'https://twitter.com/DeukaeWeverse/status/'
const postBacklog: number[] = []

async function run() {
    console.log(`Version ${version}`)
    testTrans()
    loadTweets()
    await Weverse.init({allPosts: true, allMedia: false, allNotifications: false})
    backlog()
    onThisDay()
    setInterval(onThisDay, 86400000)
    Weverse.listen({listen: true, interval: 5000, process: true})
    Weverse.on('post', (post) => handlePost(post, false, false))
    Weverse.on('comment', async (comment, post) => {
        const tweetText = emoji(comment.artist.id) + ' replied to '
                        + emoji(post.artist.id) + ': '
                        + comment.body + '\n'
                        + memberHash(comment.artist.id) + '\n'
        const replyTo = tweets.get(post.id)
        if (replyTo) {
            const withQuote = tweetText + '\n'
            const tweet = await Twitter.v1.tweet(
                withQuote + footer, 
                { attachment_url: twtPrefix + replyTo.id_str }
            )
            replyWithTrans(comment.body, comment.artist.id, tweet)
            console.log(tweet)
        }
    })
    Weverse.on('poll', status => {
        if (!status) {
            console.log('Failed to poll Weverse: ', new Date().toLocaleString())
        }
    })
}

async function handlePost(post: WeversePost, otd: boolean, trim: boolean) {
    const suffix = trim ? '' : footer
    const today = post.createdAt
    const body = post.body
        ? emoji(post.artist.id) + ': ' + post.body + '\n\n'
        : emoji(post.artist.id) + '\n\n'
    const tweetText = body + memberHash(post.artist.id) + '\n'
    const date = today.getFullYear().toString().substring(2)
                    + (today.getMonth() + 1).toString().padStart(2, '0')
                    + today.getDate().toString()
    const prefix = otd ? `[ON THIS DAY ${date}]\n` : `[${date}]\n`
    const TEXT = prefix + tweetText + (trim ? '' : suffix)
    try {
        let tweet: TweetV1 | undefined
        let medias: string[] | undefined
        if (post.photos && post.photos.length) {
            const photos = await Promise.all(post.photos.map(p => downloadImg(p.orgImgUrl)))
            medias = await Promise.all(photos.map(p => {
                return Twitter.v1.uploadMedia(p.buffer, { type: p.ext })
            }))
            tweet = await Twitter.v1.tweet(TEXT, { media_ids: medias })
            console.log(tweet)
            tweets.set(post.id, tweet)
            savedTweets.push({postId: post.id, tweet: tweet})
        } else if (post.attachedVideos) {
            const videos = await Promise.all(post.attachedVideos.map(v => downloadImg(v.videoUrl)))
            medias = await Promise.all(videos.map(v => {
                return Twitter.v1.uploadMedia(v.buffer, { type: v.ext })
            }))
            tweet = await Twitter.v1.tweet(TEXT, { media_ids: medias })
            console.log(tweet)
            tweets.set(post.id, tweet)
            savedTweets.push({postId: post.id, tweet: tweet})
        } else {
            tweet = await Twitter.v1.tweet(TEXT)
            console.log(tweet)
            tweets.set(post.id, tweet)
            savedTweets.push({postId: post.id, tweet: tweet})
        }
        if (tweet && post.body) {
            replyWithTrans(post.body, post.artist.id, tweet, medias, trim)
        }
    } catch(e) {
        const err = e as any
        console.error(e)
        if (err.code === 403 && !trim) {
            await handlePost(post, otd, true)
            return
        }
        postBacklog.push(post.id)
        const fileName = post.artist.id.toString() + '-' + post.id.toString() + '.txt'
        fs.writeFileSync(path.join(__dirname, `/tweets/${fileName}`), TEXT, 'utf-8')
    } finally {
        saveBacklog()
        saveTweets()
    }
}

async function replyWithTrans(text: string, artist: number, tweet: TweetV1, media?: string[], trim?: boolean) {
    trim = (trim === undefined || trim === false) ? false : true
    const suffix = trim ? '' : footer
    try {
        const translations = await Google.translate(text, 'en')
        const tweetText = '[TRANS]\n' + emoji(artist) + ': ' + translations[0] + '\n\n' + memberHash(artist) + '\n'
        await Twitter.v1.reply(tweetText + (trim ? '' : suffix), tweet.id_str, {media_ids: media})
    } catch (e) {
        console.error(e)
    }
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
    console.log(`loaded ${array.length} tweets from json`)
}

async function testTrans() {
    const r = await Google.translate('뀨우😚\n썸냐들 정말 봄이 왔나봐요ㅠㅠㅠㅠㅠ🌸좋다ㅠㅠ', 'en')
    console.log(r[0])
}

async function backlog() {
    const postIds = JSON.parse(fs.readFileSync(path.join(__dirname, '/tweets/backlog.json'), 'utf-8')) as number[]
    console.log('backlog:', postIds)
    postIds.forEach(async id => {
        const post = await Weverse.getPost(id, 14)
        console.log('backlog post:')
        console.log(post)
        if (post) {
            handlePost(post, false, false)
        }
    })
}

async function onThisDay() {
    const today = new Date()
    const post = sameDay(today)
    if (post) {
        if (!tweets.has(post.id)) {
            handlePost(post, true, false)
        }
    } else {
        console.log('No OTD today')
    }
}

function sameDay(d: Date): WeversePost | undefined {
    return Weverse.posts.find(p => {
        return p.createdAt.getFullYear() !== d.getFullYear()
               && p.createdAt.getMonth() === d.getMonth()
               && p.createdAt.getDate() === d.getDate()
      })
}

function saveBacklog() {
    const data = JSON.stringify(postBacklog, null, 2)
    fs.writeFileSync(path.join(__dirname, '/tweets/backlog.json'), data, 'utf-8')
}

run()