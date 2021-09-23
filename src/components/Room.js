import React, { useState, useEffect, useCallback } from "react";
import Video from "twilio-video";
import User from "./User";
import DominantUser from "./DominantUser";
import { Container, Row, Col, Button, Navbar, Nav } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faVideoSlash,
  faMicrophoneSlash,
  faMicrophone,
  faDesktop,
  faVideo,
  faThumbsUp,
  faHeadphones,
  faRssSquare,
} from "@fortawesome/free-solid-svg-icons";

const Room = ({ meetingname, token, emotion, logout, test }) => {
  const [room, setRoom] = useState(null);
  const [user, setUser] = useState([]);
  //create user array here
  //implement
  const [newDomName, setNewDomName] = useState("");
  const [mute, setMute] = useState(false);
  const [videomute, setVideomute] = useState(false);
  const [deafenmute, setDeafenmute] = useState(false);
  var intervalID;
  var sentiment_intervalID;

  // const reaction = require("./reaction");
  // const activateEmojiButtons = reaction.activateEmojiButtons;
  // const addLocalData = reaction.addLocalData;
  // activateEmojiButtons();
  // addLocalData();
  // const dataTrack = reaction.dataTrack;

  const helpers = require("./helpers");
  const muteYourAudio = helpers.muteYourAudio;
  const unmuteYourAudio = helpers.unmuteYourAudio;

  const { LocalDataTrack } = require(`twilio-video`);

  console.log("Room.js render");

  const takeSnapshot = (room, users) => {
    if (!room.localParticipant.videoTracks.entries().next()) {
      var videoElement = room.localParticipant.videoTracks.entries().next()
        .value[1].track.mediaStreamTrack;
      var imageCapture = new ImageCapture(videoElement);
      imageCapture
        .grabFrame()
        .then((bitmap) => {
          console.log("bitmap :", bitmap);
          let canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          let context = canvas.getContext("2d");

          context.drawImage(bitmap, 0, 0);
          canvas.toBlob(function (blob) {
            // console.log(blob);
            var reader = new FileReader();
            reader.addEventListener("loadend", () => {
              fetch(reader.result)
                .then((res) => res.blob())
                .then((blob) => {
                  // console.log("here is your binary: ", blob);
                  fetch(
                    "/video/snapShot?identity=" +
                      room.localParticipant.identity +
                      "&room=" +
                      room.name,
                    {
                      method: "POST",
                      body: blob,
                      headers: {
                        "Content-Type": "application/octet-stream",
                      },
                    }
                  );
                });
            });
            reader.readAsDataURL(blob);
          }, "image/jpeg");
        })
        .catch(function (error) {
          console.log("takePhoto() error: ", error);
        });
    }
  };

  //passing array here
  //user state = array for rendering
  const updateUserSentiments = (users) => {
    console.log(users);
    users.forEach((u) => {
      fetch("/video/emotion?identity=" + u.identity + "&room=" + room.name, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        u.emotion = res.body.emotion;
      });
    });
  };

  const restartSentiment = (user) => {
    if (sentiment_intervalID) {
      window.clearInterval(sentiment_intervalID);
    }
    sentiment_intervalID = window.setInterval(
      updateUserSentiments,
      10000,
      user
    );
  };

  useEffect(() => {
    console.log("dominant speacjer Room.js effect");

    const participantConnected = (new_user) => {
      console.log("Room.js - particiapnt connected", new_user);
      //add user to array
      setUser((prevusers) => [...prevusers, new_user]);

      restartSentiment(user);
    };

    const participantDisconnected = (gone_user) => {
      console.log("Room.js - particiapnt disconnected", gone_user, user);

      //remove user from array
      setUser((prevusers) => prevusers.filter((p) => p !== gone_user));
      // setUser((prevusers) => prevusers.splice(prevusers.indexOf(gone_user), 1));
      restartSentiment(user);
      console.log(user);
    };

    const ParticipantNewDominantSpeaker = (user) => {
      if (user !== null) {
        // console.log("new dominant speaker Room.js");
        setNewDomName(user.identity);
      } else if (user === null) {
        setNewDomName(null);
      }
    };

    const participantRemoteVideoMuted = (track, user) => {
      // console.log("Room.js - Track disable", track, user);
    };

    const participantRemotedAudioMuted = (track, user) => {};

    let dataTrack; // add this at the top with the other variable declarations

    function addToLocalDataLabel(newText) {
      let localDataLabel = document.getElementById("datalocal");
      localDataLabel.innerHTML = newText;
      animateDataLabel(localDataLabel, "appear");
    }

    function sendDataToRoom(data, id, identity) {
      dataTrack.send(
        JSON.stringify({
          emojiData: data,
          user: id,
          identity: identity,
        })
      );
    }

    function emojiButtonHandler(event) {
      let emojiButton = event.target;
      let emojiText = emojiButton.innerHTML;
      addToLocalDataLabel(emojiText);

      setRoom((currentRoom) => {
        console.log("id", currentRoom);
        sendDataToRoom(
          emojiText,
          currentRoom.localParticipant.sid,
          currentRoom.identity
        );
        return currentRoom;
      });
      console.log("id", room, "fdsafsadas");
    }

    function activateEmojiButtons() {
      let emojiButtonGroup = document.getElementsByClassName("emojibuttons");
      let emojiButton;
      for (let i = 0; i < emojiButtonGroup.length; i++) {
        emojiButton = emojiButtonGroup[i];
        emojiButton.addEventListener("click", emojiButtonHandler);
      }
    }

    activateEmojiButtons();

    function addLocalData() {
      // Creates a Local Data Track
      var localDataTrack = new LocalDataTrack();
      dataTrack = localDataTrack;
    }
    addLocalData();

    function animateDataLabel(div, startClass) {
      setTimeout(function () {
        div.classList.remove(startClass);
      }, 1000);
      div.classList.add(startClass);
    }

    Video.connect(token, {
      name: meetingname,
      dominantSpeaker: true,
      audio: true,
      video: true,
    }).then((room) => {
      console.log("Room.js - line 59 - video.connect", room);
      setRoom(room);
      // Publishing the local Data Track to the Room
      // room.localParticipant.publishTrack(dataTrack);
      //intervalID = window.setInterval(takeSnapshot, 10000, room,user);
      room.on("participantConnected", participantConnected);
      room.on("participantDisconnected", participantDisconnected);
      room.on("dominantSpeakerChanged", ParticipantNewDominantSpeaker);
      room.on("trackDisabled", participantRemoteVideoMuted);
      room.localParticipant.publishTrack(dataTrack);
      room.participants.forEach(participantConnected);
      intervalID = window.setInterval(takeSnapshot, 50000, room, user);
    });

    return () => {
      if (intervalID) {
        window.clearInterval(intervalID);
      }
      setRoom((currentRoom) => {
        if (currentRoom && currentRoom.localParticipant.state === "connected") {
          currentRoom.localParticipant.tracks.forEach(function (
            trackPublication
          ) {
            trackPublication.track.stop();
          });
          console.log("disconnect!!!!!!");
          currentRoom.disconnect();
          return null;
        } else {
          return currentRoom;
        }
      });
    };
  }, [meetingname, token]);

  const mutecallback = useCallback(() => {
    console.log("called mutecallback, button pressed");
    if (mute === false && room !== null) {
      helpers.muteYourAudio(room);
      setMute(true);
    } else if (mute === true && room !== null) {
      helpers.unmuteYourAudio(room);
      setMute(false);
    }
  }, [mute, room]);

  const mutevideocallback = useCallback(() => {
    console.log("called mutevideocallback, button pressed");
    if (videomute === false && room !== null) {
      helpers.muteYourVideo(room);
      setVideomute(true);
    } else if (videomute === true && room !== null) {
      helpers.unmuteYourVideo(room);
      setVideomute(false);
    }
  }, [videomute, room]);

  const defeancallback = useCallback(() => {
    console.log("called deafencallback, button pressed");
    if (deafenmute === false && room !== null) {
      muteYourAudio(room);
      setDeafenmute(true);
    } else if (deafenmute === true && room != null) {
      unmuteYourAudio(room);
      setDeafenmute(false);
    }
  }, [room, deafenmute]);

  const logoutcallback = useCallback(() => {
    console.log("testing - line 125!!!!!!", room);
    if (room && room.localParticipant.state === "connected") {
      room.localParticipant.tracks.forEach(function (trackPublication) {
        if (
          trackPublication.track.kind == "video" ||
          trackPublication.track.kind == "audio"
        ) {
          trackPublication.track.stop();
        }
      });
      //debugger;
      room.disconnect();
    }
    logout();
  }, [room]);

  const remoteParticipants = user.map((user, index) => (
    <User key={index} user={user} mute={deafenmute} />
  ));

  return (
    <div className="room">
      <Container className="cameras" fluid="true">
        <Row className="cameras-row">
          <Col sm={2} className="local-participant">
            {room ? (
              <div className="local-participant-camera">
                <User
                  key={room.localParticipant.sid}
                  user={room.localParticipant}
                  mute={deafenmute}
                  local={"i"}
                />
                <div id="datalocal" className="emoji"></div>
              </div>
            ) : (
              ""
            )}
            <div className="remote-participants">{remoteParticipants}</div>
          </Col>
          <Col sm={10} className="dominant">
            <DominantUser
              className="dominant-user"
              key={"dominant"}
              room={room}
            />
            <div className="dominant-header-bg">
              <div className="dominant-header">
                <div className="dominant-header-room">
                  Room Name: {meetingname}
                </div>
                <div className="dominant-header-speaker">
                  Talking: {newDomName}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <Container fluid="true">
        <div className="toolbar">
          <div className="toolbar-items">
            <div className="logoutbutton">
              <button
                className="logoutbutton-btn danger"
                onClick={logoutcallback}
              >
                LOG OUT
              </button>
            </div>
            <div className="btns-toolbar">
              <div className="col-audio">
                {mute ? (
                  <button className="btn1 info" onClick={mutecallback}>
                    <span className="btn2">Mute</span>
                    <FontAwesomeIcon
                      className="btnsize"
                      icon={faMicrophoneSlash}
                    />
                  </button>
                ) : (
                  <button className="btn1 info" onClick={mutecallback}>
                    <span className="btn2">Mute</span>
                    <FontAwesomeIcon className="btnsize" icon={faMicrophone} />
                  </button>
                )}
              </div>
              <div className="col-video">
                {videomute ? (
                  <button className="btn1 info" onClick={mutevideocallback}>
                    <span className="btn2">Camera</span>
                    <FontAwesomeIcon className="btnsize" icon={faVideoSlash} />
                  </button>
                ) : (
                  <button className="btn1 info" onClick={mutevideocallback}>
                    <span className="btn2">Camera</span>
                    <FontAwesomeIcon className="btnsize" icon={faVideo} />
                  </button>
                )}
              </div>
              <div className="col-silence">
                {deafenmute ? (
                  <button className="btn1 info" onClick={defeancallback}>
                    <span className="btn2">Silence</span>
                    <FontAwesomeIcon className="btnsize" icon={faTimes} />
                  </button>
                ) : (
                  <button className="btn1 info" onClick={defeancallback}>
                    <span className="btn2">Silence</span>
                    <FontAwesomeIcon className="btnsize" icon={faHeadphones} />
                  </button>
                )}
              </div>
            </div>
            <div className="col-emoji">
              <div
                className="emojiPanel"
                style={{
                  padding: "1rem",
                }}
              >
                <div className="reaction-container">
                  <span className="reaction-label-like">Like</span>
                  <button
                    id="emoji-wink"
                    className="btn3 warning emojibuttons"
                    style={{
                      marginRight: "1rem",
                    }}
                  >
                    <span className="reaction-entity">&#128077;</span>
                  </button>
                </div>

                <div className="reaction-container">
                  <span className="reaction-label-dislike">Dislike</span>
                  <button
                    id="emoji-eyes"
                    className="btn3 warning emojibuttons"
                    style={{
                      marginRight: "1rem",
                    }}
                  >
                    <span className="reaction-entity">&#128078;</span>
                  </button>
                </div>

                <div className="reaction-container">
                  <span className="reaction-label-love">Love</span>
                  <button
                    id="emoji-heart"
                    className="btn3 warning emojibuttons"
                    style={{
                      marginRight: "1rem",
                    }}
                  >
                    <span className="reaction-entity">&#10084;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Room;
