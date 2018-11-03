const express = require('express');
var bodyParser = require('body-parser');
const app = express();
const port = 3000;
const db = require('./database.js')
const validator = require('./validator.js')
const { performance } = require('perf_hooks');
require('dotenv').config();

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
    if(!req.query.length){ return res.json({ status: 'error', error: 'გთხოვთ შეიყვანოთ წინადადების ზომა.' }) }
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

app.post('/dataset/verify', async (req, res) => {
    if(!req.body.password || req.body.password !== process.env.VERIFICATION_PASSWORD){ res.json({ status: 'error', error: 'პაროლი არასწორია.' }) }
    if(!req.body.datasetid) { res.json({ status: 'error', error: 'გთხოვთ აირჩიოთ ტექსტი.' }) }

    await db.verifyDataset(req.body.datasetid);

    res.json({ status: 'success', message: 'ტექსტი გააქტიურებულია.' })
});

app.post('/dataset/submit', async (req, res) => {
    let configs = [
        {
            variable: 'name', variableText: 'ტექსტის სახელი', min: 5, max: 100
        },
        {
            variable: 'description', variableText: 'ტექსტის აღწერა', min: 10, max: 50
        },
        {
            variable: 'author', variableText: 'ავტორის სახელი', min: 2, max: 30
        },
        {
            variable: 'text', variableText: 'შესასწავლი ტექსტი', min: 20, max: 5000
        }
    ]

    let errors = validator.validate(req.body, configs);

    if(![]) { return res.json({ status: 'error', errors: errors }) }

    let dataset = await db.createDataset(req.body.name, req.body.description, req.body.author, req.body.text);

    res.json({ 
        status: 'success', 
        message: 'ტექსტი დამატებულია. ვერიფიკაციის შემდეგ ამ ტექსტს მარკოვ ბოტი შეისწავლის.',
        data: {
            dataset: dataset
        }
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));