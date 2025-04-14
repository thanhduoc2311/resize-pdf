const fs = require('fs');
const express = require('express');
const upload = require('express-fileupload');
const multer = require('multer');
const bodyParser = require('body-parser');
const router = express.Router();
const fileWorker = require('../backend/compress.js');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(upload());
app.use(express.static("public"));
app.use('/', router);

// Router middleware (chưa làm gì cụ thể)
router.use((req, res, next) => {
    next();
});

// Routes
app.post('/upload', fileWorker.upload);
app.get('/getFileList', fileWorker.filelist);
app.get('/download', fileWorker.download);
app.post('/delete', fileWorker.delete);

app.get('/filelist', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
const port = process.env.PORT || 3100;
app.listen(port, err => {
    console.log(`Listening on port: ${port}`);
});
