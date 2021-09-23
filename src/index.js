import React from "react";
import ReactDOM from "react-dom";
import "./css/index.css";
import "./css/App.css";
import "./css/style.css";

import App from "./App";

// import reportWebVitals from './reportWebVitals';

// button.addEventListener('click', () => {
//   Twilio.Video.createLocalVideoTrack().then(track => {
//     container.append(track.attach());
//     button.remove();
//   });
//   button.remove();
// })

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("body")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
