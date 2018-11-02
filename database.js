require('dotenv').config();

const { Pool, Client } = require('pg');

addCombination = (firstWord, secondWord) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });

    const query = {
        text: 'SELECT * FROM combinations WHERE (firstword=$1) AND (secondword=$2)',
        values: [firstWord, secondWord],
    }

    client.connect();
    client.query(query)
    .then(res => {
        if(res.rowCount === 0){
            const query = {
                text: 'INSERT INTO combinations (firstword, secondword, timesseen) VALUES ($1, $2, 1)',
                values: [firstWord, secondWord],
            }
            client.query(query)
            .then(res => {
                client.end()
                console.log('Combination of "' + firstWord + '" and "' + secondWord + '" added to database.')
            })
            .catch(e => console.error(e.stack))
        } else {
            let newTimesSeen = res.rows[0].timesseen + 1;
            client.query('UPDATE combinations SET timesseen=' + newTimesSeen + 'WHERE id=' + res.rows[0].id)
            .then(res => {
                client.end()
                console.log('Combination of "' + firstWord + '" and "' + secondWord + '" has now been seen ' + newTimesSeen + ' times.')
            })
            .catch(e => console.error(e.stack))
        }
    })
    .catch(e => {
        client.end()
        console.error('error', e.stack)
    })
}

function search(nameKey, myArray){
    for (var i=0; i < myArray.length; i++) {
        if (myArray[i].nextWord === nameKey) {
            return i;
        }
    }
    return false;
}

getNextWords = async (firstWord) => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });

    const query = {
        text: 'SELECT * FROM combinations WHERE (firstword=$1)',
        values: [firstWord],
    }

    await client.connect();
    const res = await client.query(query);
    await client.end();

    if(res.rowCount === 0){
        await client.end()
        getRandomWord().then(random => {
            return [{ nextWord: random, chance: 1}];
        })
    } else {
        let words = [];
        let totalCount = 0;
        for(let i = 0; i < res.rows.length; i++){ totalCount += res.rows[i].timesseen; }
        for(let i = 0; i < res.rows.length; i++){
            words.push({
                nextWord: res.rows[i].secondword,
                chance: res.rows[i].timesseen / totalCount
            });
        }

        return words;
    }
}

getRandomWord = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: true
    });

    await client.connect();
    const res = await client.query('SELECT * FROM combinations ORDER BY RANDOM() LIMIT 1');

    await client.end()
    if(res.rowCount !== 0){ return res.rows[0].firstword; }
}

module.exports = {
    addCombination, getNextWords, getRandomWord,
}