const express = require('express');
const router = express.Router();
const pup = require('puppeteer');
const cheerio = require('cheerio');
const unirest = require("unirest");

router.get('/images',(req, res)=>{
  res.json({message: "第一個api?"})
})

router.route('/dictionary/:query')
.get(async (req, rsp) => {
  const query = req.params.query;
  let result = {
    query: query,
    content:[]
  }
  
  const browser = await pup.launch();
  const page = await browser.newPage();
  await page.goto('https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/' + query)

  try {
    await page.waitForSelector('#sidebarNav')
  
    const body = await page.content()
  
    const $ = await cheerio.load(body)

    const wordHeader =  $('#page-content .pos-header')
    const pos = $('.pos', wordHeader).text()
    const kk = $('.us .pron', wordHeader).text()

    result.kk = kk
    result.pos = pos

    await $("#page-content .def-block").each((i,el)=>{
      const definition = $('.def', $(el)).text()
      const translation = $('.def-body .trans:nth-child(1)', $(el)).text()
      const countable = $('.gc', $(el)).text()
      const examples = []
      $('.examp', $(el)).each((i,exp)=>{
        const eg = $('.eg', $(exp)).text()
        const trans = $('.trans', $(exp)).text()
        examples.push({sentence:eg, translation: trans})
      })

      result.content.push({
        definition, translation, countable, examples
      })
    })

    rsp.json(result)
    
  } catch (error) {
    console.log(error);
    browser.close();
  }

})

router.route('/translate').get(async (request, rsp) => {
  console.log('translate query: ',request.query);
  const words = request.query.word
  if (!words) return rsp.status(400).json({error:"Need 'word' in http query."});

  const from = request.query.from || "en"
  const to = request.query.to || "zh-Hant"
  if (!words) return rsp.status(400).json({error:"Need 'to' in http query."});

  const req = unirest("POST", "https://microsoft-translator-text.p.rapidapi.com/translate");
  const reqData = Array.isArray(words) ? words.map(one=>{ return { "Text": one }}) : [{"Text": words}]

  req.query({
    to,
    "api-version": "3.0",
    from,
    "profanityAction": "NoAction",
    "textType": "plain"
  });

  req.headers({
    "content-type": "application/json",
    "x-rapidapi-key": process.env.RAPIDAPI_KEY,
    "x-rapidapi-host": process.env.RAPIDAPI_HOST,
    "useQueryString": true
  });

  req.type("json");
  req.send(reqData);

  req.end(function (res) {
    console.log('MS translate result: ', res.body);
    if (res.error) return rsp.status(res.error.status).json(res.body);

    rsp.json(res.body)
  });
  
})

module.exports = router;