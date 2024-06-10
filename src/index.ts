import express from 'express';
import {Client} from '@elastic/elasticsearch';
import * as fs from 'fs';

const elasticClient  = new Client({
    node: 'https://localhost:9201',
    auth: {
        username: 'elastic',
        password: 'elastic123'
    },
    tls: {
        ca: fs.readFileSync('./ca/ca.crt'),
        rejectUnauthorized: false
    }
})

async function run() {
    const result  = await elasticClient.search({
        index: 'search_data', 
        body: {
            query: {
                multi_match: {
                    query: 'material handler memphis',
                    fields: ['desiredposition^0.5', 'location'],
                    fuzziness: 'auto'
                }
            }
        }
    });

    console.log(JSON.stringify(result, null, 2));
}

run();

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, TypeScript with Express!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});