"use strict";
/**
 * Express Server for hosting ethfundraiser Public files
 * Hosts \public\index.html and interacts with web server
 */


// Set-up Express HTTP AND HTTPS servers
const express   = require("express");
const fs        = require("fs");
const https     = require("https");
const app       = express();
const portHTTP  = 3000;  // Change to 8080 for live hosting
const portHTTPS = 8443;
const certPath  = "PATH TO YOUR CERTIFICATES, e.g. /etc/letsencrypt/live/URL";
const options   = {
  cert: fs.readFileSync(`${certPath}/fullchain.pem`),
  key: fs.readFileSync(`${certPath}/privkey.pem`)
};

// Redirect HTTP to HTTPS
app.all("*", ensureSecure);

// Set-up directory used to serve static files
app.use(express.static("./public"));

// Start HTTPS server
https.createServer(options, app)
  .listen(portHTTPS, function() {
    console.log(`Express HTTPS Web Server is running on port ${portHTTPS}...`);
  });

// Start HTTP server
app.listen(portHTTP, function(){
  console.log(`Express Web Server is running on port ${portHTTP}...`);
});

// basic server message logging
app.put("/logs/:message", function (req, res) {
  console.log(req.params.message);
  res.send(`Web Server Message Logged`);
});

// Function to redirect HTTP to HTTPS 
function ensureSecure(req, res, next) {
  if (req.secure) {
    // OK to continue
    return next();
  }
  // If not OK, redirect to https
  res.redirect("https://" + req.hostname + req.originalUrl);
}