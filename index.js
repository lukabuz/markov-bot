const express = require('express');
var bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db = require('./database.js')
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let random = db.getRandomWord().then(random => {console.log('random word' , random)});
let list = db.getNextWords('test').then(res => {console.log('list' , res)});

app.get('/', (req, res) => {
    if(!req.query.length){ res.json({ status: 'error', error: 'Please provide the sentence length.' }) }

    res.json({ status: 'success', message: lastWord })
});

app.post('/train', (req, res) => {
    if(!req.query.text){ res.json({ status: 'error', error: 'Please provide the response texts.' }) }
    let text = req.query.text;
    text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g," ").replace(/\s{2,}/g," ");;
    let wordsArray = text.split(' ');

    for(let i = 0; i < wordsArray.length - 1; i++){
        db.addCombination(wordsArray[i], wordsArray[i + 1]);
    }

    res.json({ status: 'success', message: 'Text has been parsed and bot has been trained.' })
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));