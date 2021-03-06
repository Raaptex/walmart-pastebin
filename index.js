const express = require('express');
const fs = require("fs")
const app = express();
app.use(express.urlencoded({extended:true})) //magic
const hashmap = require('hashmap');
const ips = new hashmap()
const crsfs = []
require("dotenv").config(".env")

app.use(function (req, res, next) {
    if(req.method != "POST"){
        next();
        return;
    }
       
    let ip = req.headers['x-forwarded-for']
    let last = -1
    if(!ips.has(ip)){
        last = performance.now();
        ips.set(ip, last)
        next();
        return;
    }
       
    last = ips.get(ip)

    if(performance.now() - last >= 5000){
        ips.set(ip, performance.now())
        next();
    }else{
        res.send("Rate limit")
    }
  });

app.get("/", (req, res) => {
    let csrf = makeid(10)
    crsfs.push(csrf)
    let data = fs.readFileSync(__dirname + "/public/index.html").toString().replace("{csrf}", csrf)
    res.send(data)
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
        return res.send("error body");
    }
    if(req.body.pasteContent == null|| req.body.pasteExpiration == null || req.body.csrf == null || req.body.pasteTitle == null){
        return res.send("error");
    }
    if(crsfs.includes(req.body.csrf)){
        crsfs.slice(crsfs.indexOf(req.body.csrf), 1)
    }else{
        return res.send("error csrf");
    }

    let url = makeid(5);
    let data = {
        url: url,
        content: req.body.pasteContent,
        expiration: req.body.pasteExpiration,
        visit:0,
        title: req.body.pasteTitle
    }

    fs.writeFile(__dirname + '/pastes/' + url, JSON.stringify(data), function (err,data) {
        if (err) {
            res.send("error write file");
            return console.log(err); 
        }
        res.redirect("/" + url);
    });
   
});

function sendError(res, error){
    let template = fs.readFileSync(__dirname + "/public/error.html").toString();
    template = template.replace("{error}", error);
    res.send(template);
}

app.get("/raw/:url", (req, res) => {
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
       sendError(res,"This paste does not exist!");
    }
})

app.get("/:url", (req, res) => {
    let path = __dirname + "/pastes/" + req.params.url
    if(fs.existsSync(path)) {
        let data = JSON.parse(fs.readFileSync(path));
        //res.send("this is not raw but something else : " + data.content + " visits : " + data.visit + " expiration : " + data.expiration + " title : " + data.title);
        let template = fs.readFileSync(__dirname + "/public/paste.html").toString();
        template = template.replace("{title}", data.title);
        template = template.replace("{title}", data.title);
        res.send(template)
        data.visit += 1;
        fs.writeFileSync(path, JSON.stringify(data));  
        if(data.expiration == "onetime"){
            if(data.visit > 1) {
                fs.unlinkSync(path);
            }
        }   
    }else{  
        sendError(res,"This paste does not exist!");
    }

})

app.get("/assets/:name", (req, res) => {
    res.sendFile(__dirname + "/public/assets/" + req.params.name);
});

app.listen(process.env.port, () => {
    console.log("Uploaded on port " + process.env.port);
});