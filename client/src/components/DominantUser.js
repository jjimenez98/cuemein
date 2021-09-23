import React, { useState, useEffect, useRef, useCallback } from "react";
import { Row, Col, Button, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMehBlank,
  faGrinStars,
  faMeh,
  faTired,
  faFrownOpen,
  faSadTear,
  faLaughBeam,
  faAngry,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

const DominantUser = ({ room }) => {
  const [videoTrackss, setVideoTrackss] = useState([]);
  const [audioTrackss, setAudioTrackss] = useState([]);
  const [emotion, setEmotion] = useState("-");
  const [emotion_style, setEmotion_Style] = useState("participant-video");
  const [dominant, setDominant] = useState(null);

  const videoref = useRef();
  const audioref = useRef();

  function attachRemoteDataTrack(div, track) {
    console.log(div);
    let d = document.getElementById(div);
    console.log(d, "user.id DIV");
    let dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", track.sid);
    dataDiv.setAttribute("class", "emoji");
    d.appendChild(dataDiv);
  }

  function addToRemoteDataLabel(newText, dataTrackSID) {
    let remoteDataLabel = document.getElementById(dataTrackSID);
    remoteDataLabel.innerHTML = newText;
    // animateDataLabel(remoteDataLabel, "appear");
  }

  useEffect(() => {
    const ParticipantDominantSpeaker = (user) => {
      setDominant(user);
      console.log("new dominant speaker Dominant.js");
    };
    if (room !== null) {
      room.on("dominantSpeakerChanged", ParticipantDominantSpeaker);
    }
  }, [room]);

  const trackpubsToTracks = (trackMap) =>
    Array.from(trackMap.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null);

  useEffect(() => {
    if (dominant != null) {
      setVideoTrackss(trackpubsToTracks(dominant.videoTracks));
      setAudioTrackss(trackpubsToTracks(dominant.audioTracks));

      const trackSubscribed = (track) => {
        if (track.kind === "video") {
          setVideoTrackss((videoTracks) => [...videoTracks, track]);
        } else if (track.kind === "audio") {
          setAudioTrackss((audioTracks) => [...audioTracks, track]);
        } else if (track.kind == "data") {
          track.on("message", (data) => {
            // attachRemoteDataTrack(JSON.parse(data).user, track);
            // addToRemoteDataLabel(JSON.parse(data).emojiData, track.sid);
            console.log(
              JSON.parse(data).user,
              JSON.parse(data).emojiData,
              JSON.parse(data).identity,
              "Dominant-REACTION"
            );
          });
        }
      };

      const trackUnsubscribed = (track) => {
        if (track.kind === "video") {
          setVideoTrackss((videoTracks) =>
            videoTracks.filter((v) => v !== track)
          );
        } else if (track.kind === "audio") {
          setAudioTrackss((audioTracks) =>
            audioTracks.filter((v) => v !== track)
          );
        }
      };

      dominant.on("trackSubscribed", trackSubscribed);
      dominant.on("trackUnsubscribed", trackUnsubscribed);

      return () => {
        setVideoTrackss([]);
        setAudioTrackss([]);
        dominant.removeAllListeners();
      };
    }
  }, [dominant]);

  const takeSnapshot = (videoElement) => {
    var imageCapture = new ImageCapture(videoElement);
    imageCapture
      .grabFrame()
      .then((bitmap) => {
        let canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        let context = canvas.getContext("2d");

        context.drawImage(bitmap, 0, 0);
        canvas.toBlob(function (blob) {
          var reader = new FileReader();
          reader.addEventListener("loadend", () => {
            fetch(reader.result)
              .then((res) => res.blob())
              .then((blob) => {
                const fetchUrl =
                  "/video/snapShot?identity=" +
                  dominant.identity +
                  "&room=" +
                  room.name;
                fetch(fetchUrl, {
                  method: "POST",
                  body: blob,
                  headers: {
                    "Content-Type": "application/octet-stream",
                  },
                }).then(() => {
                  //Update the UI Sentiment to display the most up-to-date sentiment, according to backend
                  fetchSentiment();
                });
              });
          });
          reader.readAsDataURL(blob);
        }, "image/jpeg");
      })
      .catch(function (error) {
        console.log("takePhoto() error: ", error);
      });
  };

  const fetchSentiment = async () => {
    const getUrl =
      "/emotion?identity=" + dominant.identity + "&room=" + room.name;
    const data = await fetch(getUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());

    setEmotion(data);
  };

  const startRecording = (audioElement, lengthInMS) => {
    let recorder = new MediaRecorder(audioElement);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
    // console.log(recorder.state + " for " + lengthInMS / 1000 + " seconds...");

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(
      () => recorder.state == "recording" && recorder.stop()
    );

    return Promise.all([stopped, recorded]).then(() => data);
  };

  const recordAudio = (audioElement, lengthInMS) => {
    const MediaStreamer = new MediaStream();
    MediaStreamer.addTrack(audioElement);
    const recorder = new MediaRecorder(MediaStreamer);
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then(() => startRecording(MediaStreamer, lengthInMS))
      .then((recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, {
          type: "application/octet-stream",
        });
        var reader = new FileReader();
        reader.addEventListener("loadend", () => {
          fetch(reader.result)
            .then((res) => res.blob())
            .then((recordedBlob) => {
              const fetchUrl =
                "/audio/snapShot?identity=" +
                dominant.identity +
                "&room=" +
                room.name;
              fetch(fetchUrl, {
                method: "POST",
                body: recordedBlob,
                headers: {
                  "Content-Type": "application/octet-stream",
                },
              }).then(() => {
                //Update the UI Sentiment to display the most up-to-date sentiment, according to backend
                fetchSentiment();
              });
            });
        });
        reader.readAsDataURL(recordedBlob);
      });
  };

  function wait(delayInMS) {
    return new Promise((resolve) => setTimeout(resolve, delayInMS));
  }

  function stop(stream) {
    stream.getTracks().forEach((track) => track.stop());
    console.log("Recording stopped");
  }

  useEffect(() => {
    if (dominant != null) {
      const videoTrack = videoTrackss[0];
      if (videoTrack) {
        videoTrack.attach(videoref.current);
      }
      // return () => {
      //   console.log("User.js detach()");
      //   videoTrack.detach();
      // };
    }
  }, [videoTrackss]);

  //Takes a snapshot, which calls to backend API to update emotion, every time there is a change in who the Dominant User is AND every 2 seconds
  useEffect(() => {
    const videoSnapshotInterval = setInterval(() => {
      if (dominant != null && videoTrackss[0].isEnabled) {
        const videoTrack = videoTrackss[0];
        if (videoTrack) {
          takeSnapshot(videoTrack.mediaStreamTrack);
        }
      }
    }, 2000);
    return () => {
      clearInterval(videoSnapshotInterval);
    }
  }, [videoTrackss]);

  //Start a new audio recording interval and stop the old one for parsing every 6 seconds
  useEffect(() => {
    const intervalInMS = 10000;
    const audioSnapshotInterval = setInterval(() => {
      console.log("New function called");
      if (dominant != null && !videoTrackss[0].isEnabled) {
        const audioTrack = audioTrackss[0];
        if (audioTrack) {
          // audioTrack.attach(audioref.current);
          recordAudio(audioTrack.mediaStreamTrack, intervalInMS);
        }
      }
    }, intervalInMS);
    return () => {
      clearInterval(audioSnapshotInterval);
      //TODO: Place something here that stops the recordAudio function for the previous dominant user
      //when the dominant user changes. This will allow the interval to restart for the new
      //dominant user right when the change happens, giving us more accurate audio (hopefully)
    };
  }, [audioTrackss]);

  let emoji;
  let emotiontext;
  if (emotion.emotion === "happiness") {
    emoji = (
      // <img
      //   className="dominant-emotion-happy-img"
      //   src="https://img.icons8.com/color/48/000000/happy--v1.png"
      // />

      <FontAwesomeIcon
        className={"dominant-emotion-happy emotion"}
        icon={faLaughBeam}
        size="2x"
      />
    );

    emotiontext = "HAPPY";
  } else if (emotion.emotion === "anger") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-angry emotion"}
        icon={faAngry}
        size="2x"
      />
    );
    emotiontext = "ANGRY";
  } else if (emotion.emotion === "sadness") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-sadness emotion"}
        icon={faSadTear}
        size="2x"
      />
    );
    emotiontext = "SADNESS";
  } else if (emotion.emotion === "fear") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-fear emotion"}
        icon={faFrownOpen}
        size="2x"
      />
    );
    emotiontext = "FEAR";
  } else if (emotion.emotion === "disgust") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-disgust emotion"}
        icon={faTired}
        size="2x"
      />
    );
    emotiontext = "DISGUST";
  } else if (emotion.emotion === "neutral") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-neutral emotion"}
        icon={faMeh}
        size="2x"
      />
    );
    emotiontext = "NEUTRAL";
  } else if (emotion.emotion === "surprise") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-surprised emotion"}
        icon={faGrinStars}
        size="2x"
      />
    );
    emotiontext = "SURPRISE";
  } else if (emotion.emotion === "-") {
    emoji = (
      <FontAwesomeIcon
        className={"dominant-emotion-undefined emotion"}
        icon={faMehBlank}
        size="2x"
      />
    );
    emotiontext = "UNDEFINED";
  }

  return (
    <Row className="dominant-camera">
      <div id={"das"} className="dominant-camera-reaction"></div>

      {dominant ? (
        <video
          className={"participant-video-dominant"}
          width="100%"
          height="100%"
          ref={videoref}
          autoPlay={true}
        />
      ) : (
        <div className={"default-video-dominant"}>
          <FontAwesomeIcon
            className={"dominant-camera-default"}
            icon={faUsers}
            size="2x"
          />
        </div>
      )}

      <div className="dominant-border-emotion-icon">
        <h3 className="dominant-border-emotion-header">Emotion</h3>
        <div className="dominant-icon">{emoji}</div>
      </div>

      <div className="dominant-border">
        {dominant ? (
          <div className="dominant-border-name">{dominant.identity}</div>
        ) : (
          ""
        )}
        <div className="dominant-border-emotion-background">
          <div className="dominant-border-emotion-text">{emotiontext}</div>
        </div>
      </div>
    </Row>
  );
};

export default DominantUser;
