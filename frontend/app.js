var fs = require('fs');
var express = require('express');
const upload = require('express-fileupload')
var multer  = require('multer')
var router = express.Router();
const fileWorker = require('../backend/compress.js');
var app = express();
var bodyParser = require('body-parser')

bodyParser = require('body-parser');
app.use('/',router);


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


var jsonParser = bodyParser.json();
app.use(express.static("public"));
app.use(upload())
app.use('/',router);


router.use((req,res,next) => {
    next();
});

app.post('/upload', fileWorker.upload);

app.get('/getFileList',fileWorker.filelist);

app.get('/download',fileWorker.download)

app.post('/delete', jsonParser, fileWorker.delete)

app.get('/filelist',function(req, res){
    res.sendFile(__dirname + '/public/index.html');
})

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/public/index.html');
});

//send email!!!---------------------------------------
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


let port = 3100;
app.listen(port, err => {
    console.log(`Listening on port: ${port}`);
  });
