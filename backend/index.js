import {fileURLToPath} from 'url';
// EXPRESS.JS
import path from "path";
import express from "express";
import cors from "cors";
import { initSpeechListener } from './services/integrations/speech-server.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
global.__dirname = __dirname; // make __dirname available globally

const DEFAULTS_PORT = 8888;

const app = express();

app.use(cors());
app.use(express.urlencoded({extended: true}));
app.use(express.json());
if (process.env.STATIC_FOLDER) {
    app.use(express.static(path.join(__dirname, process.env.STATIC_FOLDER)));
}

const port = process.env.PORT || DEFAULTS_PORT;

const server = app.listen(port, '0.0.0.0', function (err) {
    console.log("server is ready on port " + port);
});

initSpeechListener(server);