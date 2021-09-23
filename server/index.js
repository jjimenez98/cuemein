const config = require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const pino = require("express-pino-logger")();
const { videoToken } = require("./tokens");
const AudioProcessor = require("./audio-processor");
const { ProcessAudio } = require("./audio-processor");
const ImageProcessor = require("./image-processor");
const { ProcessImage } = require("./image-processor");
var fs = require("fs");
//var Video = require('twilio-video');
//var helpers = require('./helpers_old');
//var takeLocalVideoSnapshot = helpers.takeLocalVideoSnapshot;
const { connect } = require("twilio-video");
const Twilio = require("twilio");
var client = new Twilio(config.twilio.apiKey, config.twilio.apiSecret, {
  accountSid: config.twilio.accountSid,
});
const axios = require("axios").default;

var imageCapture;
var emotionsLookup = {};

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ type: "application/json" }));
app.use(bodyParser.raw({ type: "application/octet-stream" }));
app.use(pino);

const sendTokenResponse = (token, res) => {
  res.set("Content-Type", "application/json");
  res.send(
    JSON.stringify({
      token: token.toJwt(),
    })
  );
};

app.get("/api/greeting", (req, res) => {
  const name = req.query.name || "World";
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

app.post("/video/token", (req, res) => {
  const identity = req.body.identity;
  const room = req.body.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

app.post("/video/snapShot", (req, res) => {
  (async () => {
    const identity = req.query.identity;
    const room = req.query.room;
    const blob = req.body;
    // console.log(blob);
    const prediction = await ImageProcessor.ProcessImage(blob);

    // console.log(prediction);
    // console.log(typeof prediction);
    // console.log(JSON.stringify({ emotion: prediction }));

    if (prediction != null) {
      emotionsLookup[room] = emotionsLookup[room] || {};
      emotionsLookup[room][identity] = { emotion: prediction };
    }

    res.status(200).contentType("image/jpeg").send(blob);
  })();
});

app.get("/emotion", (req, res) => {
  const identity = req.query.identity;
  const room = req.query.room;
  // console.log(emotionsLookup);
  var currentRoom = emotionsLookup[room] || {};
  var lastEmotion = currentRoom[identity] || { emotion: "-" };
  // console.log(lastEmotion);
  res.status(200).contentType("application/json").send(lastEmotion);
});

app.post("/audio/snapShot", (req, res) => {
  (async () => {
    const identity = req.query.identity;
    const room = req.query.room;
    const blob = req.body;
    // console.log(blob);
    const prediction = await AudioProcessor.ProcessAudio(blob);

    // console.log(prediction);
    // console.log(typeof prediction);
    // console.log(JSON.stringify({ emotion: prediction }));

    if (prediction != null) {
      emotionsLookup[room] = emotionsLookup[room] || {};
      emotionsLookup[room][identity] = { emotion: prediction };
    }

    res.status(200).contentType("audio/webm").send(blob);
  })();
});

app.listen(3001, () =>
  console.log("Express server is running on localhost:3001")
);
