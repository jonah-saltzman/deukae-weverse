import axios from 'axios'
import path from 'path'

export function string(val: unknown): string {
    if (typeof val !== 'string') throw new Error()
    return val
}

interface Img { buffer: Buffer, filename: string, ext: string }

export async function downloadImg(url: URL): Promise<Img> {
    console.log(url.toString())
    const filename = path.basename(url.pathname)
    const filetype = path.extname(filename).substring(1)
    const response = await axios.get(url.toString(), { responseType: 'arraybuffer' })
    if (response.status === 200) {
        return { buffer: response.data, filename, ext: filetype }
    } else {
        throw new Error()
    }
}

export function emoji(id: number): string {
    switch(id) {
        case 61:
            return 'π°'
        case 62:
            return 'π₯'
        case 63:
            return 'πΊ'
        case 64:
            return 'π±'
        case 65:
            return 'πΆ'
        case 66:
            return 'πΌ'
        case 67:
            return 'π¦'
        default:
            throw new Error()
    }
}

export function memberHash(id: number): string {
    switch(id) {
        case 61:
            return '#JIU'
        case 62:
            return '#SUA'
        case 63:
            return '#SIYEON'
        case 64:
            return '#HANDONG'
        case 65:
            return '#YOOHYEON'
        case 66:
            return '#DAMI'
        case 67:
            return '#GAHYEON'
        default:
            throw new Error()
    }
}

export const footer = '\n#DREAMCATCHER #λλ¦ΌμΊμ³'