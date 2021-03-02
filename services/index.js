'use strict';

const https = require('https');
const cheerio = require('cheerio');
const Definition = require('../models');

const scrapeDefinition = (word, from, to, cb) => {
  let url = "";
  if(from.includes('en') && to.includes('zh')){
    console.log('scrape en -> zh: ', word);
    url = dictionaryUrls.cambridge + word
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
      cb(defs)
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
    const $ = cheerio.load(html);
    let definitions = [];

    $('#page-content .entry-body__el').each((i, el) => {
      const wordHeader =  $('.pos-header',$(el))
      const pos = $('.pos', wordHeader).text()
      let oneDef = {
        word: $('.headword .hw', wordHeader).text(),
        phonetics:[],
        meanings:[]
      };

      //發音 phonetics
      $('.dpron-i', wordHeader).each((i, el) => {
        oneDef.phonetics.push({
          text: $('.pron', $(el)).text()
        })
      })

      //定義
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

        oneDef.meanings.push({
          partOfSpeech: pos,
          definition, 
          translation, 
          countable, 
          example
        })
      })
      
      definitions.push(oneDef)
    })
    return definitions
  }
}

const dictionaryUrls = {
  cambridge:"https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/"
}
module.exports = {
  scrapeDefinition
}