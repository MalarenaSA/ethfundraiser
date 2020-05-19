"use strict";
/**
 * Express Server for hosting Ether Fund Raiser Front End files
 * Hosts \public\index.html and interacts with web server
 */


// Set-up server
const express  = require("express");
const app      = express();
const port     = 3000;  // Change to 8080 for live hosting

// setup directory used to serve static files
app.use(express.static("./public"));

// start server
app.listen(port, function(){
  console.log(`Express Web Server is running on port ${port}...`);
});

// basic server message logging
app.put("/logs/:message", function (req, res) {
  console.log(req.params.message);
  res.send(`Web Server Message Logged`);
});