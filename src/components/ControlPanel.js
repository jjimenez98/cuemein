import React from 'react';
import {Container, Row, Form, Button} from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css';

const ControlPanel = ({
  username,
  handleUsernameChange,
  roomName,
  handleRoomNameChange,
  handleSubmit
}) => {
  return (
    <Container className="controlpanel" fluid>
      <Row className="cmilogo">
        <img src= "/cuemeinlogo.png" width="400" height="400"></img>
      </Row> 
      <Row className="control">
          <Form onSubmit={handleSubmit}>
            <Form.Label className="meeting">Join a Meeting</Form.Label>

            <Form.Group>
            <Form.Label className="name">Name:</Form.Label>
            <Form.Control className="inputname" size="lg" type="name" value={username}  onChange={handleUsernameChange} placeholder="User ID" />
            </Form.Group>

            <Form.Group>
            <Form.Label className="meetingname">Meeting name:</Form.Label>
            <Form.Control className="inputmeetingname" size="lg" type="meetingname"  value={roomName}  onChange={handleRoomNameChange} placeholder="Room Name" />
            </Form.Group>

            <Button variant="success" type="submit" >JOIN</Button>
          </Form>
        {/* <form onSubmit={handleSubmit}>
          <h1>Enter a Meeting</h1>
          <div>
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="field"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>

          <div>
            <label htmlFor="room">Meeting name:</label>
            <input
              type="text"
              id="room"
              value={roomName}
              onChange={handleRoomNameChange}
              required
            />
          </div>
          <button type="submit">Submit</button>
        </form> */}
      </Row>
    </Container>
  );
};

export default ControlPanel;