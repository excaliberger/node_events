const { createServer } = require("http");
const { appendFile, readFile } = require("fs");
const path = require("path");
const { EventEmitter } = require("events");
const { create } = require("domain");

const NewsLetter = new EventEmitter()

const server = createServer((req, res) => {
    const chunks = [];
    const { url, method } = req;

    req.on("error", (err) => {
        console.log(err);
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.write(JSON.stringify({ msg: "invalid request" }));
        res.end();
    })

    req.on("data", (chunk) => {
        chunks.push(chunk);
    });

    req.on("end", (event) => {
        if (url === "/newsletter_signup" && method === "POST") {
            console.log(event);

            const body = JSON.parse(Buffer.concat(chunks).toString());

            const newContact = `${body.name}, ${body.email}/n`
            NewsLetter.emit("signup", newContact, res);

            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({ msg: "successfully signed up"}));
            res.end()
        } else if (url === "/newsletter_signup" && method === "GET") {
            readFile(path.join(__dirname, "./index.html"), (err, data) => {
                if (err) { 
                    console.log(err);
                    res.emit("error", err);
                    return;
                } else {
                    res.setHeader("Content-Type", "text/html")
                    res.write(data);
                    res.end();
                }
            }) 
        } else {
            res.statusCode = 404;
            res.setHeader("Content-Type", "application/json");
            res.write(JSON.stringify({ msg: "nope nothing here but us chickens"}))
        }
    })
})

server.listen(3000, () => console.log("server listening...") )

NewsLetter.on("signup", (newContact2, res) => {
    
    appendFile(
        path.join(__dirname, "assets/newsletter.csv"), 
        newContact2,
        (err) => {
            if (err) {
                console.log(err);
                NewsLetter.emit("error", err, res)
                return;
            }
                console.log("the file was updated succesfully")
            });
        });

NewsLetter.on("error", (err) => {
    console.log(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.write(JSON.stringify({ msg: "error adding new contact for newsletter" }));
    res.end();
});