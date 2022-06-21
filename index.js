const express = require('express');
const fs = require("fs")
const app = express();
app.use(express.urlencoded({extended:true})) //magic
const hashmap = require('hashmap');
const pastes = new hashmap();
require("dotenv").config(".env")

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * 
        charactersLength));
    }
    return result;
}

app.post("/paste", (req, res) => {
    if(req.body === null){
        return res.send("error")
    }
    if(req.body.pasteContent === null){
        return res.send("error")
    }
    let url = makeid(5);
    pastes.set(url, req.body.pasteContent);
    res.redirect("/" + url);
    save()
    


});


function save(){
    to_save = [] //empty?
    pastes.forEach((value, key) => {
        to_save.push({
            url:key,
            value: value
        })
    })

    fs.writeFileSync("config.json", JSON.stringify(to_save))
}

function load(){
    if(!fs.existsSync("config.json"))
        return;
    
    const config = JSON.parse(fs.readFileSync("config.json"))
    //loop through all elements of config using forEach
    config.forEach((value) => {
        pastes.set(value.url, value.value);
    });

}

//sqfqsfq

app.get("/:url", (req, res) => {
    if(pastes.has(req.params.url)){
        res.type('text/plain');
        res.send(pastes.get(req.params.url))
    }else{
        res.send("This paste doesn't exist")
    }
})

app.get("/assets/:name", (req, res) => {
    res.sendFile(__dirname + "/public/assets/" + req.params.name);
});

app.listen(80, () => {
    load()
});