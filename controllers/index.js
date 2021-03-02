const svc = require('../services');
const unirest = require("unirest");

const getDefinition = (req, rsp)=>{
  const word = req.query.word
  const from = req.query.from
  const to = req.query.to
  if(from.includes('en') && to.includes('zh')){
    svc.scrapeDefinition(word, from, to, (defs)=>{
      rsp.send(defs)
    })
  }else{
    const url = "https://api.dictionaryapi.dev/api/v2/entries/"+ from +"/" + word
    console.log('dictionaryapi ' + from + ' : ' + word);
    unirest("GET", url).then(result=>{
      rsp.send({
        reference:{
          dictionary: "dictionaryapi",
          url
        },
        result: result.body
      })
    });
  }
}

module.exports = {
  getDefinition
}