import { PythonShell } from 'python-shell'
import fs from 'fs'
import dotenv from 'dotenv'
import { IgUsers, GraphImage, GraphStory, Scrape } from './types.js'
import { string } from '../helpers/index.js' 

dotenv.config()

const IG_USER = string(process.env.IG_USER)
const IG_PASS = string(process.env.IG_PASSWORD)

export function scrapeIG(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const options = {
            scriptPath: './instagram-scraper/instagram_scraper',
            args: [
                name,
                '-u', IG_USER,
                '-p', IG_PASS,
                '--media-metadata',
                '--media-types', 'none',
                '-d', './ig-data',
                '-T', '{username}.json',
                '--cookiejar', './ig-data/cookies',
                '-m', '1'
            ]
        }
        PythonShell.run('app.py', options, (err, out) => {
            if (err) {
                console.log(err)
                reject()
            } else {
                resolve()
            }
        })
    })
}

export function processData(name: string) {
    const data = fs.readFileSync('./ig-data/' + name + '.json', 'utf-8')
    const json = JSON.parse(data)
    console.log(json)
}