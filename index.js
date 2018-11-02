const express = require('express');
var bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db = require('./database.js')
const { performance } = require('perf_hooks');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

chooseNextWord = (nextWords) => {
    let randomWeight = Math.random(0, 1);

    for(let j = 0; j < nextWords.length; j++){
        randomWeight = randomWeight - nextWords[j].chance;
        if(randomWeight <= 0) { 
            console.log('randomWeight: ', randomWeight);
            return nextWords[j].nextWord;
        }
    }
}

app.get('/', async (req, res)=> {
    if(!req.query.length){ res.json({ status: 'error', error: 'Please provide the sentence length.' }) }
    let length = req.query.length;
    let t0 = performance.now();
    
    let previousWord = await db.getRandomWord();
    let sentence = '';

    for(i = 0; i < length; i++){
        console.log('___________');
        console.log('i: ', i);
        console.log('previousword: ', previousWord);
        sentence = sentence + previousWord;
        if(Math.random() <= 0.05) { sentence = sentence + '. ' } else { sentence = sentence + ' ' }
        
        let nextWords = await db.getNextWords(previousWord);

        console.log('nextWords: ', nextWords);

        previousWord = chooseNextWord(nextWords);

        console.log('sentence: ', sentence);
        console.log('___________');
    }

    let time = (performance.now() - t0) / 1000;
    time = Number((time).toFixed(1)) + ' s';

    res.json({ status: 'success', message: sentence, time: time })
});

app.post('/train', async (req, res) => {
    if(!req.body.text){ res.json({ status: 'error', error: 'Please provide the response texts.' }) }
    let text = req.body.text;
    text = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g," ").replace(/\s{2,}/g," ");;
    let wordsArray = text.split(' ');

    for(let i = 0; i < wordsArray.length - 1; i++){
        await db.addCombination(wordsArray[i], wordsArray[i + 1]);
    }

    console.log('done adding ' + wordsArray.length + ' words to Database')

    res.json({ status: 'success', message: 'Text has been parsed and bot has been trained.' })
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));