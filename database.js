require('dotenv').config();

const { Pool, Client } = require('pg');

const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

addCombination = async (firstWord, secondWord) => { return new Promise(async resolve => {
    const query = {
        text: 'SELECT * FROM combinations WHERE (firstword=$1) AND (secondword=$2)',
        values: [firstWord, secondWord],
    }

    let res = await client.query(query);

    if(res.rowCount === 0){
        const query = {
            text: 'INSERT INTO combinations (firstword, secondword, timesseen) VALUES ($1, $2, 1)',
            values: [firstWord, secondWord],
        }
        await client.query(query);
        console.log('Combination of "' + firstWord + '" and "' + secondWord + '" added to database.')
        resolve()
    } else {
        let newTimesSeen = res.rows[0].timesseen + 1;
        await client.query('UPDATE combinations SET timesseen=' + newTimesSeen + 'WHERE id=' + res.rows[0].id)
        resolve()
    }
});}

getNextWords = async (firstWord) => { return new Promise(async resolve => {
    const query = {
        text: 'SELECT * FROM combinations WHERE (firstword=$1)',
        values: [firstWord],
    }

    const res = await client.query(query);

    if(res.rowCount === 0){
        let random = await getRandomWord();
        resolve([{ nextWord: random, chance: 1, random: true}]);
    } else {
        let words = [];
        let totalCount = 0;
        for(let i = 0; i < res.rows.length; i++){ totalCount += res.rows[i].timesseen; }
        for(let i = 0; i < res.rows.length; i++){
            words.push({
                nextWord: res.rows[i].secondword,
                chance: res.rows[i].timesseen / totalCount,
                random: false
            });
        }
        resolve(words);
    }
});
}

getRandomWord = async () => { return new Promise(async resolve => {
    const res = await client.query('SELECT * FROM combinations ORDER BY RANDOM() LIMIT 1');

    if(res.rowCount !== 0){ resolve(res.rows[0].firstword); } else { resolve('NA'); }
});
}

createDataset = async (name, description, author, text) =>{ return new Promise(async resolve => {
    const query = {
        text: 'INSERT INTO datasets (name, description, author, text, verified) VALUES ($1, $2, $3, $4, false) RETURNING *',
        values: [name, description, author, text],
    }

    const res = await client.query(query);

    resolve(res.rows[0]);
});}

verifyDataset = async (datasetId) => { return new Promise(async resolve => {
    const query = {
        text: 'SELECT * FROM datasets WHERE ID=$1 LIMIT 1',
        values: [datasetId],
    }

    const res = await client.query(query);

    if(res.rowCount !== 1) { resolve(false) }

    let text = res.rows[0].text;
    text = text.replace(/[.,\/#!"'@$%\^&\*;:{}=\-_`~()]/g,'').replace(/\s{2,}/g,' ');;
    let wordsArray = text.split(' ');

    for(let i = 0; i < wordsArray.length; i++){
        wordsArray[i] = wordsArray[i].replace(/[^\w\s!?]/g,'').replace(/(\r\n\t|\n|\r\t)/gm,'');;
        if( wordsArray[i] == '') { delete wordsArray[i] }
    }

    for(let i = 0; i < wordsArray.length - 1; i++){
        await addCombination(wordsArray[i], wordsArray[i + 1]);
    }

    await client.query({
        text: 'UPDATE datasets SET verified=true WHERE ID=$1',
        values: [datasetId],
    });

    resolve(true);
});}

module.exports = {
    addCombination, getNextWords, getRandomWord, createDataset, verifyDataset
}