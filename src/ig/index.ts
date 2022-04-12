import { scrapeIG } from './scrape.js'
import { IgUsers } from './types.js'
export * from './types.js'

export async function getIgPosts() {
    for (const user of IgUsers) {
        await scrapeIG(user)
    }
}