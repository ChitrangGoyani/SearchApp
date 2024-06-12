import express from 'express';
import {Client} from '@elastic/elasticsearch';
import * as fs from 'fs';
import { Request, Response } from 'express';
import { AggregationsAggregate, SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
const prisma = new PrismaClient();

interface QueryReqBody {
    query: string;
    fields: string;
}

interface ElasticSearchResult {
    email: string;
    type: string;
    lastname: string;
    "@timestamp": string;
    location: string;
    desiredposition: string;
    firstname: string;
    userid: number;
    jobstatus: string;
    phone: string;
    address: string;
    createdat: string;
    "@version": string;
    updatedat: string;
}

interface User {
    id: number | null;
    lastName: string | null;
    firstName: string | null;
    location: string | null;
    experience: string | null;
    desiredPosition: string | null;
}

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

async function run(queryText: string, fields: string[]): Promise<SearchResponse<ElasticSearchResult, Record<string, AggregationsAggregate>>> {
    const searchQuery = {
        index: 'search_data', 
        body: {
            query: {
                multi_match: {
                    query: queryText,
                    fields: fields,
                    fuzziness: 'auto'
                }
            }
        }
    }
    const result  = await elasticClient.search<ElasticSearchResult>(searchQuery);
    
    // console.log(JSON.stringify(result, null, 2));
    return result;
}

const stringToArray = (fields: string): string[] => {
    return fields.split(',');
}

const app = express();
const port = 3000;

app.use(cors())
app.use(express.json())

app.post('/search', (req: Request, res: Response) => {
    const { query, fields }: QueryReqBody = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const fieldArray: string[] = stringToArray(fields);
    const elastic = async () => {
        const data = await run(query, fieldArray);
        const hits = data.hits.hits;
        return hits;
    }

    const fetchUsers = async (): Promise<User[]> => {
        const hits = await elastic();
        console.log(JSON.stringify(hits, null, 2));
        const userIds: number[] = [];
        // for each userid in hits fetch profile, experience and skills
        hits.forEach(element => {
            const candidate: ElasticSearchResult | undefined = element._source;
            if(candidate) userIds.push(candidate?.userid);
        });
        const users: User[] = [];
        for(const id of userIds) {
            const profile = await prisma.fake_profiles.findFirst({
                where: {
                    userId: id,
                }
            });

            const experience = await prisma.fake_experience.findFirst({
                where: {
                    userId: id,
                }
            });

            if(!profile || !experience) return [];
            const user: User = {
                id: profile.userId,
                lastName: profile.lastName,
                firstName: profile.firstName,
                location: profile.location,
                desiredPosition: profile.desiredPosition,
                experience: experience.description
            }

            users.push(user);
        }

        console.log(users);
        return users;
    }
    try {
        fetchUsers().then((users) => {
            res.json({message: "search completed", users});
        })
    } catch (err) {
        res.json({message: "Error", err});
    }
    
})

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});