//Regular Events
import https from 'https';
import fs from 'fs';
import express from 'express';
import {Client, middleware} from '@line/bot-sdk';
import firebase from 'firebase';
//Events
import {follow} from './Events/events_follow';
import {handleLocation, handleText} from './Events/events_message';
import admin from "firebase-admin";
import serviceAccount from "./shalat-diary-b25ad401ff6c";
import {handlePostback} from "./Events/events_postback";

const app = express();

const CHANNEL_ACCESS_TOKEN = 'D9JnIsMjrRUysTqDg7KCrWZjlNZoJxl3SfoW8C1B3ICB5pVnsLzqos8UogA12/ZFaKQMrYdjhybkzu6DI6/kct/R4JMGA6ffxanqgilP67y7RjmsARwQ9EGoRpseCO0H06G4cRwU0MD5Q73Xa6vwhQdB04t89/1O/w1cDnyilFU=';
const CHANNEL_SECRET = '26ace68ef19ead93d2e88e83cba4a1a6';
const config = {
    channelAccessToken: CHANNEL_ACCESS_TOKEN,
    channelSecret: CHANNEL_SECRET,
};
const client = new Client(config);

const configFirebase = {
    apiKey: "AIzaSyCAveXkK3a66orD-6ouTnj7S_FPIS6yQ-I"
};

if (!firebase.apps.length) {
    firebase.initializeApp(configFirebase);
}
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
app.post('/callback', middleware(config), (req, res) => {
    res.writeHead(200);
    Promise
        .all(req.body.events.map(handleEvent))
        .then(result => {
            res.json(result);
            console.log(result);
        })
        .catch(err => {
            console.log(err);
            res.status(500).end();
        });
});

function handleEvent(event) {
    switch (event.type) {
        case 'follow':
            return follow(event.replyToken, event.source, client, db);
        case 'postback':
            return handlePostback(event.replyToken, event.source, event.postback, client, db);
        case 'message':
            const message = event.message;
            switch (message.type) {
                case 'text':
                    return handleText(message, event.replyToken, event.source, event.timestamp, client, db);
                case 'location':
                    return handleLocation(message, event.replyToken, event.source, client, db);
            }
    }
}

const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/bukanavatar.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/bukanavatar.com/fullchain.pem")
};

https.createServer(options, app).listen(1234);