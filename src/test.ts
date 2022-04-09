import { WeverseClient } from "weverse"
import { TwitterApi } from 'twitter-api-v2'
import { string, downloadImg, emoji } from "./helpers/index.js"
import dotenv from 'dotenv'

dotenv.config()
const wvToken = string(process.env.WV_TOKEN)
const twtKey = string(process.env.TWT_CONSUMER_KEY)
const twtSecret = string(process.env.TWT_CONSUMER_SECRET)
const oauthToken = string(process.env.TWT_OAUTH_TOKEN)
const oauthSecret = string(process.env.TWT_OAUTH_SECRET)
const twtBot = string(process.env.TWT_USER)

const Twitter = new TwitterApi({
    appKey: twtKey,
    appSecret: twtSecret,
    accessToken: oauthToken,
    accessSecret: oauthSecret}).readWrite

const Weverse = new WeverseClient({token: wvToken}, true)



async function run() {

    const img = await downloadImg(new URL('https://cdn-contents-web.weverse.io/user/xlx2048/jpg/ec7ff25c721d43e8baa49d45ee335661812.jpg'))
    const mediaId = await Twitter.v1.uploadMedia(img.buffer, {type: img.ext})
    const r = await Twitter.v1.tweet('image:', {media_ids: mediaId})
    console.log(r)
    // await Weverse.init({allPosts: false, allMedia: false, allNotifications: false})
    // Weverse.listen({listen: true, interval: 5000, process: true})
    // Weverse.on('post', async post => {
    //     if (post.photos && post.photos.length) {
    //         const photos = await Promise.all(post.photos.map(p => downloadImg(p.orgImgUrl)))
    //         const mediaIds = await Promise.all(photos.map(p => {
    //             return Twitter.v1.uploadMedia(p.buffer, { type: p.ext })
    //         }))
    //         const tweetText = emoji(post.artist.id) + ': ' + post.body
    //         const tweet = await Twitter.v1.tweet(tweetText, { media_ids: mediaIds })
    //         console.log(tweet)
    //     }
    // })
    // Weverse.on('poll', status => {
    //     console.log('Polled Weverse: ', status, new Date().toLocaleString())
    // })
}

run()