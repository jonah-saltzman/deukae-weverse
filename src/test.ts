import {v2} from '@google-cloud/translate'
import dotenv from 'dotenv'
import { TweetV1, TwitterApi } from 'twitter-api-v2'
import { string }  from "./helpers/index.js"
dotenv.config()

const twtKey = string(process.env.TWT_CONSUMER_KEY)
const twtSecret = string(process.env.TWT_CONSUMER_SECRET)
const oauthToken = string(process.env.TWT_OAUTH_TOKEN)
const oauthSecret = string(process.env.TWT_OAUTH_SECRET)

const { Translate } = v2

const twtPrefix = 'https://twitter.com/DeukaeWeverse/status/'
const twtId = '1513188328019054596'

const Twitter = new TwitterApi({
    appKey: twtKey,
    appSecret: twtSecret,
    accessToken: oauthToken,
    accessSecret: oauthSecret
}).readWrite

async function translateText() {
  const withQuote = 'quote tweet\n' + twtPrefix + twtId + '\n'
  await Twitter.v2.tweet(withQuote)
}

translateText();