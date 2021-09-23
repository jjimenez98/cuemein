import React, { useState, useCallback } from "react";
import ControlPanel from "./ControlPanel";
import Room from "./Room";

const Meeting = () => {
  const [username, setUsername] = useState("");
  const [meetingname, setRoomName] = useState("");
  const [token, setToken] = useState(null);

  const roomname_change = useCallback((event) => {
    setRoomName(event.target.value);
  }, []);

  const username_change = useCallback((event) => {
    setUsername(event.target.value);
  }, []);

  const submit = useCallback(
    async (event) => {
      event.preventDefault();

      const data = await fetch("/video/token", {
        method: "POST",
        body: JSON.stringify({
          identity: username,
          room: meetingname,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      setToken(data.token);
    },
    [meetingname, username]
  );

  const logout = useCallback((event) => {
    setToken(null);
  }, []);

  let result;
  if (token) {
    result = <Room meetingname={meetingname} token={token} logout={logout} />;
  } else {
    result = (
      <ControlPanel
        username={username}
        roomName={meetingname}
        handleUsernameChange={username_change}
        handleRoomNameChange={roomname_change}
        handleSubmit={submit}
      />
    );
  }
  return result;
};

export default Meeting;
