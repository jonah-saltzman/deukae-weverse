
type TypeGuard<T> = (val: unknown) => T
type TypeConverter<T, U> = (val: T) => U

const string: TypeGuard<string> = (val: unknown) => {
    if (typeof val !== 'string') throw new Error()
    return val
}

const boolean: TypeGuard<boolean> = (val: unknown) => {
    if (typeof val !== 'boolean') throw new Error()
    return val
}

const number: TypeGuard<number> = (val: unknown) => {
    if (typeof val !== 'number') throw new Error()
    return val
}

const url: TypeConverter<string, URL> = (val: unknown) => {
    if (val === undefined) return new URL('https://PLACEHOLDER.weverse.com')
    if (typeof val !== 'string') throw new Error()
    const url = new URL(val)
    return url
}

const date: TypeConverter<number, Date> = (val: unknown): Date => {
    if (typeof val !== 'number') throw new Error()
    return new Date(val)
}

const array = <T>(inner: TypeGuard<T>) => (val: unknown): T[] => {
    if (!Array.isArray(val)) throw new Error();
    return val.map(inner);
}

const cArray = <T, U>(inner: TypeConverter<T, U>) => (val: unknown): U[] => {
    if (!Array.isArray(val)) throw new Error();
    return val.map(inner);
}

const object = <T extends Record<string, TypeGuard<any> | TypeConverter<any, any>>>(inner: T) => {
    return (val: unknown): { [P in keyof T]: ReturnType<T[P]> } => {
        if (val === null || typeof val !== 'object') throw new Error();

        const out: { [P in keyof T]: ReturnType<T[P]> } = {} as any;

        for (const k in inner) {
            out[k] = inner[k]((val as any)[k])
        }

        return out
    }
}

export const GraphImage = object({
    edge_media_to_caption: object({
        edges: array(object({
            node: object({
                text: string
            })
        }))
    }),
    id: string,
    is_video: boolean,
    taken_at_timestamp: date,
    urls: cArray(url),
})

export type GraphImage = ReturnType<typeof GraphImage>

export const GraphStory = object({
    id: string,
    is_video: boolean,
    urls: cArray(url),
    video_resources: array(object({
        mime_type: string,
        src: url
    }))
})

export type GraphStory = ReturnType<typeof GraphStory>

export enum IG {
    JIU = 'minjiu__u',
    SUA = 'sualelbora',
    SIYEON = '______s2ing',
    HANDONG = '0.0_handong',
    YOOH = 'ms.yoohyeonkim',
    DAMI = '00ld_ami',
    GAH = 'fox._.zzlo_'
}

export type Scrape = {
    images: GraphImage[],
    stories: GraphStory[]
}

export const IgUsers = [IG.JIU, IG.SUA, IG.SIYEON, IG.HANDONG, IG.YOOH, IG.DAMI, IG.GAH]