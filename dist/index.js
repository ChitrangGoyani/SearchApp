"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const elasticsearch_1 = require("@elastic/elasticsearch");
const fs = __importStar(require("fs"));
const elasticClient = new elasticsearch_1.Client({
    node: 'https://localhost:9201',
    auth: {
        username: 'elastic',
        password: 'elastic123'
    },
    tls: {
        ca: fs.readFileSync('./ca/ca.crt'),
        rejectUnauthorized: false
    }
});
async function run() {
    const result = await elasticClient.search({
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
    console.log(result);
}
run();
const app = (0, express_1.default)();
const port = 3000;
app.get('/', (req, res) => {
    res.send('Hello, TypeScript with Express!');
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
