var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const rp = require('request-promise');
const $ = require('cheerio');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use((req, res, next) => {
  res.header("'User-Agent': 'Mozilla/5.0'")
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
})
 
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const listVerbs = async () => {
  let url = `https://deutschlernerblog.de/1100-unregelmaessige-und-starke-deutsche-verben-nach-sprachniveau-a1-c2/`;
  let verbs_div = '';
  await rp({
    url,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json:true
  })
  .then(function(html){
    //success!
    verbs_div = $(`.column-1`, html).text();
    console.log('verbs_div');
    console.log(verbs_div);
  })
  .catch(function(err){
    //handle error
    console.log(err)
    console.log('something went wrong')
  });
  console.log('finished scraping')
  let verbs_no_brackets = verbs_div.replace(/ *\([^)]*\) */g, " ")
  let verbs_array = verbs_no_brackets.split(' ')
  let verbs_final_array = verbs_array.splice(0)
  // delete verbs_array[0]
  console.log(verbs_final_array)
  return data = { html: JSON.stringify(verbs_final_array) }
}

const getExamples = async (data_received) => {
  const { tense, verb } = JSON.parse(data_received)
  // let examples_received = JSON.parse(data_received)
    console.log('data_received from examples')
    console.log(verb)
    console.log(data_received)
    console.log(typeof(data_received))

    let url = `https://context.reverso.net/translation/german-english/${verb}`;
    let examples_div = '';
  await rp({
    url,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json:true
  })
  .then(function(html){
    //success!
    examples_div = $(`[class="example"]`, html).text();
    console.log('examples_div');
    console.log(examples_div);
  })
  .catch(function(err){
    //handle error
    console.log(err)
    console.log('something went wrong')
  });
  examples_arr = examples_div.split(' \n ')
  console.log('examples_arr')
  console.log(examples_arr)
  console.log(typeof(examples_arr))
  console.log('finished scraping')
  // res.send('getting examples ..')

  let sentences = examples_arr.filter(x => x.length > 15)
  sentences.forEach(element => {
    sentences[element] = element.trim()
  });

  console.log('sentences')
  console.log(sentences)
  return data = { sentences_arr: sentences }
}

const scrapeVerb = async (data_received) => {
  const { tense, verb } = data_received
  let new_verb = verb.replace('ß', 'ss')
  let url = `https://conjugator.reverso.net/conjugation-german-verb-${new_verb}.html`;
  let conjugation_div = '';
  await rp(url)
  .then(function(html){
    //success!
    conjugation_div = $(`[mobile-title="Indikativ ${tense}"]`, html).html();
    console.log('conjugation_div');
    console.log(conjugation_div);
  })
  .catch(function(err){
    //handle error
    console.log(err)
    console.log('something went wrong')
  });
  console.log('finished scraping')
  return data = { html: conjugation_div.toString() }
}

app.post('/common-verbs', async (req, res) => {
  let data = await listVerbs()
  console.log('data')
  console.log(data)
  res.send(data)
})

app.post('/conjugate', (req, res) => {
  console.log('GOT A REQ')
  let data_received = '';
  req.on('data', chunk => {
    console.log('there is data ..')
    data_received = chunk.toString()
  })

  req.on('end', async () => {
    console.log('data_received')
    console.log(data_received)
    console.log(typeof(data_received))

    let data_sent = await scrapeVerb(JSON.parse(data_received))
    let data = await getExamples(data_received)
    console.log('about to send data')
    console.log(data)
    let send_data = {}
    send_data['verbs'] = data_sent
    let tempArray = []
    for (index = 0; index < data.sentences_arr.length; index += 2) {
      let myChunk = data.sentences_arr.slice(index, index+2);
      // Do something if you want with the group
      tempArray.push(myChunk);
    }

    console.log('tempArray')
    console.log(tempArray)
    send_data['examples'] = tempArray
    // console.log('send_data')
    // console.log(send_data.verbs)
    res.status(200).json(send_data)
  })
})

app.get('/', (req, res) => {
  res.send('OK')
})

app.listen(5555, () => {
  console.log(`Listening ... 🚀`);
});

module.exports = app;
