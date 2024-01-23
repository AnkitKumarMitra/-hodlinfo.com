import express from 'express';
import axios from 'axios';
import pg from 'pg';
import env from 'dotenv';
import bodyParser from 'body-parser';

env.config();
const app = express();
const port = 3000;
const API = `https://api.wazirx.com/api/v2/tickers`;
const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hodlinfo',
    password: process.env.PASSWORD,
    port: 5433,
})

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());




app.get("/", async (req, res) => {
    try {
        const response = await axios.get(API);
        const data = response.data;

        const top10Data = Object.values(data).slice(0, 10);
        const top10Results = [];

        for (const crypto of top10Data) {
            let percentageDifference = 0;
            let savingsInRupees = 0;
            const storedData = await db.query(`
                SELECT * FROM crypto_data WHERE name = $1
            `, [crypto.name]);

            if (storedData.rows.length > 0) {
                const storedCrypto = storedData.rows[0];

                if (crypto.sell != 0 && crypto.buy != 0 && crypto.volume != 0) {
                    percentageDifference = ((parseFloat(crypto.sell) - parseFloat(crypto.buy)) / parseFloat(crypto.buy)) * 100;
                    savingsInRupees = (parseFloat(crypto.sell) - parseFloat(crypto.buy)) * parseFloat(storedCrypto.volume);
                } else {
                    percentageDifference = 0;
                }

                top10Results.push({
                    ...crypto,
                    percentageDifference,
                    savingsInRupees,
                });
                await db.query(`
                    UPDATE crypto_data
                    SET last = $1, buy = $2, sell = $3, volume = $4
                    WHERE name = $5
                `, [crypto.last, crypto.buy, crypto.sell, crypto.volume, crypto.name]);
            } else {
                top10Results.push(crypto);

                await db.query(`
                    INSERT INTO crypto_data (name, last, buy, sell, volume, base_unit)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (name) DO NOTHING
                `, [crypto.name, crypto.last, crypto.buy, crypto.sell, crypto.volume, crypto.base_unit]);
            }
        }

        res.render("index.ejs", { result: top10Results});

    } catch (error) {
        console.error('Error fetching and storing data:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post("/get-price", async (req, res) => {
    const name = req.body.crypto + '/' + req.body.currency;
    const price = await db.query(`SELECT buy FROM crypto_data WHERE name = $1;`, [name]);
    console.log(price.rows);
    res.json({
        cost: price.rows
    })
});

app.listen(port, () => {
    console.log(`Server Running at port ${port}.`);
});