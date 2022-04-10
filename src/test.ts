import {v2} from '@google-cloud/translate'
import dotenv from 'dotenv'
dotenv.config()

const { Translate } = v2
// Creates a client
const translate = new Translate();

/**
 * TODO(developer): Uncomment the following lines before running the sample.
 */
const text = '뀨우😚\n썸냐들 정말 봄이 왔나봐요ㅠㅠㅠㅠㅠ🌸좋다ㅠㅠ';
const target = 'en';

async function translateText() {
  // Translates the text into the target language. "text" can be a string for
  // translating a single piece of text, or an array of strings for translating
  // multiple texts.
  let translations = await translate.translate(text, target);
  console.log(translations.length)
  console.log(translations[0])
}

translateText();