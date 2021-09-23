const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
const helmet = require("helmet"); // creates headers that protect from attacks (security)
const cors = require("cors"); // allows/disallows cross-site communication
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const config = require("./config");
const pino = require("express-pino-logger")();
const { videoToken } = require("./server/tokens");
const AudioProcessor = require("./server/audio-processor");
const { ProcessAudio } = require("./server/audio-processor");
const ImageProcessor = require("./server/image-processor");
const { ProcessImage } = require("./server/image-processor");
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

// --> Add this
// ** MIDDLEWARE ** //
const whitelist = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://cuemeinn.herokuapp.com",
];
const corsOptions = {
  origin: function (origin, callback) {
    console.log("** Origin of request " + origin);
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log("Origin acceptable");
      callback(null, true);
    } else {
      console.log("Origin rejected");
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(helmet());
// --> Add this
app.use(cors(corsOptions));

if (process.env.NODE_ENV === "production") {
  // Serve any static files
  app.use(express.static(path.join(__dirname, "client/build")));
  // Handle React routing, return all requests to React app
  app.get("*", function (req, res) {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

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

app.listen(port, (err) => {
  if (err) return console.log(err);
  console.log("Server running on port: ", port);
});
