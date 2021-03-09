'use strict';

const https = require('https');
const cheerio = require('cheerio');
const Definition = require('../models');

const scrapeDefinition = (word, from, to, cb) => {
  let url = "";
  let reference = { dictionary:"", url:"" }
  if( from.includes('en') && to.includes('zh') ){
    word = word.trim().replace(" ","-")
    console.log('scrape en -> zh: ', word);
    url = dictionaryUrls.cambridge + word
    reference.dictionary = "cambridge"
    reference.url = url
  }else{
    return cb(null)
  }
  https.get(url, (res) => {
    let html = "";

    res.on("data", chunk => {
      html += chunk;
    })

    res.on('end', () => {
      const parser = new Parser(word, from, to);
      const defs = parser.parse(html);
      let message = null
      if(defs.length === 0) message = "Didn't find any result."
      cb({
        reference,
        result: defs,
        message
      })
    })
  })
}

class Parser {
  constructor(word, from, to) {
    this.from = from;
    this.to = to;
    this.word = word;
  }

  parse(html){
    if(this.from.includes('en') && this.to.includes('zh')){
      return this.parseCambridge(html);
    }else{
      return null;
    }
  }

  parseCambridge(html){
    if(!html) return []

    const $ = cheerio.load(html);
    const headFirst = $('.pos-header')[0]
    let result = {
      word: $('.headword .hw', headFirst).text(),
      phonetics:[],
      meanings:[]
    };
    //發音 phonetics
    $('.dpron-i', headFirst).each((i, el) => {
      result.phonetics.push({
        text: $('.pron', $(el)).text(),
        region: $('.region', $(el)).text()
      })
    })

    $('#page-content .entry-body__el').each((i, el) => {
      //詞性
      const wordHeader =  $('.pos-header',$(el))
      const pos = $('.pos', wordHeader).text()

      //定義
      const definitions = []
      $('.def-block', el).each((i, el) => {
        const definition = $('.def', $(el)).text()
        const translation = $('.def-body .trans:nth-child(1)', $(el)).text()
        const countable = $('.gc', $(el)).text()
        const example = []
        $('.examp', $(el)).each((i,exp)=>{
          const eg = $('.eg', $(exp)).text()
          const trans = $('.trans', $(exp)).text()
          example.push({sentence:eg, translation: trans})
        })

        definitions.push({
          definition, 
          translation, 
          countable, 
          example
        })
      })
      result.meanings.push({definitions, "partOfSpeech": pos})
      
    })

    return [result]
  }
}

const dictionaryUrls = {
  cambridge:"https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/"
}
module.exports = {
  scrapeDefinition
}