const http = require("http");
const fs = require("fs");
const path = require("path");

const args = process.argv;

let port = 3000;

const portIndex = args.indexOf("port");

if (portIndex !== -1 && args[portIndex + 1]) {
  port = Number(args[portIndex + 1]);
}

const server = http.createServer((req, res) => {
  let fileName;

  if (req.url === "/") {
    fileName = "home.html";
  } else if (req.url === "/home") {
    fileName = "home.html";
  } else if (req.url === "/project") {
    fileName = "project.html";
  } else if (req.url === "/registration") {
    fileName = "registration.html";
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - Page Not Found");
    return;
  }

  const filePath = path.join(__dirname, fileName);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("500 - Internal Server Error");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
