import React, { useState, useEffect, useRef } from "react";
// import {Container, Row, Col, Button} from 'react-bootstrap'
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophoneSlash, faCamera } from "@fortawesome/free-solid-svg-icons";

const helpers = require("./helpers");
const muteYourAudio = helpers.muteYourAudio;
const unmuteYourAudio = helpers.unmuteYourAudio;

const User = ({ user, mute, local = "" }) => {
  const [videoTracks, setVideoTracks] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [muted, setMute] = useState(false);
  const [vmute, setVmute] = useState(false);
  const [reaction, setReaction] = useState("");
  // const [emotion, setEmotion] = useState(null);
  // const [emotion_style, setEmotion_Style] = useState("participant-video");

  const videoref = useRef();
  const audioref = useRef();
  let locals = "black-box";

  console.log("User.js", user.identity);

  const toggleMute = (muted) => {
    setMute(muted);
    console.log("toggle mute", muted);
  };

  const toggleVmute = (muted) => {
    console.log("toggleVmute", muted);
    setVmute(muted);
  };

  const trackpubsToTracks = (trackMap) =>
    Array.from(trackMap.values())
      .map((publication) => publication.track)
      .filter((track) => track !== null);

  function attachRemoteDataTrack(div, track) {
    console.log(div);
    let d = document.getElementById(div);
    console.log(d, "user.id DIV");
    let dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", track.sid);
    dataDiv.setAttribute("class", "emoji");
    d.appendChild(dataDiv);
  }
  function animateDataLabel(div, startClass) {
    setTimeout(function () {
      div.classList.remove(startClass);
    }, 5000);
    div.classList.add(startClass);
  }

  function addToRemoteDataLabel(newText, dataTrackSID) {
    let remoteDataLabel = document.getElementById(dataTrackSID);
    remoteDataLabel.innerHTML = newText;
    animateDataLabel(remoteDataLabel, "appear");
  }

  useEffect(() => {
    setVideoTracks(trackpubsToTracks(user.videoTracks));
    setAudioTracks(trackpubsToTracks(user.audioTracks));

    user.videoTracks.forEach((track) => {
      track.on("trackEnabled", toggleVmute.bind(this, false));
      track.on("trackDisabled", toggleVmute.bind(this, true));
    });

    user.audioTracks.forEach((track) => {
      track.on("trackEnabled", toggleMute.bind(this, false));
      track.on("trackDisabled", toggleMute.bind(this, true));
    });

    const trackSubscribed = (track) => {
      console.log(track, "track subs");
      if (track.kind === "video") {
        setVmute(!track.isEnabled);
        setVideoTracks((videoTracks) => [...videoTracks, track]);
      } else if (track.kind === "audio") {
        setMute(!track.isEnabled);
        setAudioTracks((audioTracks) => [...audioTracks, track]);
      } else if (track.kind == "data") {
        // Registering addToRemoteDataLabel(...) event handler Remote Data Track receive
        track.on("message", (data) => {
          console.log("DATA REACTION");
          console.log(JSON.parse(data).emojiData, track.sid);
          console.log(JSON.parse(data).user, "reaction id");
          // setReaction(JSON.parse(data).emojiData);
          attachRemoteDataTrack(JSON.parse(data).user, track);
          addToRemoteDataLabel(JSON.parse(data).emojiData, track.sid);
        });
        // Attaching the data track to a display label
        //attachRemoteDataTrack(JSON.parse(data).id, track);
        console.log("TRACK");
        console.log("TRACK", track);
      }
    };

    const trackUnsubscribed = (track) => {
      if (track.kind === "video") {
        setVideoTracks((videoTracks) => videoTracks.filter((v) => v !== track));
      } else if (track.kind === "audio") {
        setAudioTracks((audioTracks) => audioTracks.filter((a) => a !== track));
      }
      // else if (track.kind === "data") {
      //   document.getElementById(track.sid).remove();
      // }
    };

    user.on("trackSubscribed", trackSubscribed);
    user.on("trackUnsubscribed", trackUnsubscribed);

    return () => {
      setVideoTracks([]);
      setAudioTracks([]);
      user.removeAllListeners();
    };
  }, [user]);

  useEffect(() => {
    const videoTrack = videoTracks[0];
    if (videoTrack) {
      console.log("User.js attach()", user.identity);
      videoTrack.attach(videoref.current);
      return () => {
        console.log("User.js detach()", user.identity);
        videoTrack.detach();
      };
    }
  }, [videoTracks]);

  useEffect(() => {
    const audioTrack = audioTracks[0];
    if (audioTrack) {
      audioTrack.attach(audioref.current);
      return () => {
        audioTrack.detach();
      };
    }
  }, [audioTracks]);

  if (local === "i") {
    locals = "participant-video-emptyi";
  } else {
    locals = "participant-video-empty";
  }

  return (
    <div className="user-camera">
      <div id={user.sid} className="user-camera-reaction"></div>

      <div className="user-camera-box">
        {vmute ? (
          <div className="black-box">fds</div>
        ) : (
          // <video className={"participant-video-empty"} height="120"></video>
          ""
        )}
        {vmute ? (
          <FontAwesomeIcon
            className={"empty-icon-video"}
            icon={faCamera}
            size="2x"
          />
        ) : (
          // <video className={"participant-video-empty"} height="120"></video>
          ""
        )}

        {vmute ? (
          <video className={locals} width="100%" ref={videoref} />
        ) : (
          // <video className={"participant-video-empty"} height="120"></video>
          <video
            className={"participant-video"}
            width="100%"
            ref={videoref}
            autoPlay={true}
          />
        )}
      </div>

      <div className="participant-border">
        <div className="participant-border-name">{user.identity}</div>

        {muted ? (
          <div className="muted-bg">
            <FontAwesomeIcon
              className={"muted"}
              icon={faMicrophoneSlash}
              size="1x"
            />
          </div>
        ) : (
          ""
        )}
      </div>
      {mute ? (
        <audio ref={audioref} autoPlay={true} muted />
      ) : (
        <audio ref={audioref} autoPlay={true} muted />
      )}
    </div>
  );
};

export default User;
