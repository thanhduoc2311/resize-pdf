'use strict';

const { PDFNet } = require('@pdftron/pdfnet-node'); 

const fs = require('fs');
const express = require("express");
var path = require("path")

//Compress function
async function runOptimizer(filename, quality, DPI) {
  const input_path = '../upload/';
  const output_path = '../Output/';
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  const inputFile = input_path + filename + ".pdf";
  const outputFile = output_path + nameWithoutExt + "_resize.pdf";

  console.log(filename + ' Start compress!!');

  await PDFNet.runWithCleanup(async () => {
    const doc = await PDFNet.PDFDoc.createFromFilePath(inputFile);
    await doc.initSecurityHandler();

    let Quality = parseInt(quality);
    let D = parseInt(DPI);

    if (Quality <= 0) Quality = 1;
    if (Quality > 10) Quality = 10;
    if (D <= 0) D = 50;

    const image_settings = new PDFNet.Optimizer.ImageSettings();
    image_settings.setCompressionMode(PDFNet.Optimizer.ImageSettings.CompressionMode.e_jpeg);
    image_settings.setQuality(Quality);
    image_settings.setImageDPI(500, D);
    image_settings.forceRecompression(true);

    const opt_settings = new PDFNet.Optimizer.OptimizerSettings();
    opt_settings.setColorImageSettings(image_settings);
    opt_settings.setGrayscaleImageSettings(image_settings);

    await PDFNet.Optimizer.optimize(doc, opt_settings);

    await doc.save(outputFile, PDFNet.SDFDoc.SaveOptions.e_linearized);
  }, 'demo:1743846449810:613f578c03000000004e7018a291d4b97e912990fdbf2a2fb97d2918b0');

  setTimeout(() => {
    deleteWithRetry(inputFile);
  }, 1000);

  console.log(filename + ' compressed!');
}

exports.Compress = runOptimizer;

function deleteWithRetry(filePath, retries = 3, delay = 1000) {
  let attempt = 0;

  const tryDelete = () => {
    try {
      fs.unlinkSync(filePath);
      console.log('✅ Đã xóa file:', filePath);
    } catch (err) {
      if (err.code === 'EBUSY' && attempt < retries) {
        attempt++;
        console.warn(`⚠️ File đang bị giữ, thử lại lần ${attempt}...`);
        setTimeout(tryDelete, delay);
      } else {
        console.error('❌ Không thể xóa file:', err.message);
      }
    }
  };

  tryDelete();
}

// upload function
exports.upload = async (req, res) => {
  console.log("body:"+ JSON.stringify(req.body));
  if(req.files){
    var file = req.files.logo;
    var filename = file.name;
    console.log("1111111" + typeof(filename));
    
    // Di chuyển file lên server
    file.mv('../upload/' + filename, async function(err){
      if(err){
        return res.send(err);
      }

      if(file.mimetype === 'application/pdf'){    
        const nameWithoutExt = path.basename(filename, path.extname(filename));
        const quality = 5;
        const dpi = 150;
         const fileSize = getFileSize(file.size);
        await runOptimizer(nameWithoutExt, quality, dpi);

        res.json({
          success: true,
          message: "File is uploaded and compressed successfully! Filesize: ${fileSize}"
        });

      } else {
        fs.unlinkSync('../upload/' + filename);   
        res.status(400).json({
          success: false,
          message: "The type of file is not valid, please send a PDF file!"
        });
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: "No file uploaded!"
    });
  }
}

function getFileSize(size){
  if(size < 1024*1024){
      return (size/1024).toFixed(2)+'KB'
  }else if(size >= 1024*1024&&size<Math.pow(1024, 3)){
      return (size/1024.0/1024).toFixed(2)+'MB'
  }else{
      return (size/1024.0/1024/1024).toFixed(2)+'GB'
  }
}

//deletefunction
exports.delete = (req, res) => {
  const filename = req.body.filename;
  const filePath = path.join(__dirname, '../Output', filename); 

  console.log('Đang xóa file:', filePath);

  try {
    fs.unlinkSync(filePath); 
    res.send('success');
  } catch (error) {
    console.error('Lỗi khi xóa:', error.message);
    res.send('failed');
  }
};


exports.download = (req, res) => {
  var filePath = req.query.path;
  console.log('download file: '+filePath);

  const filename = path.basename(filePath);
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  filePath = path.join(__dirname, '../' + filePath);
  console.log('download file: ' + filePath);
  if (fs.existsSync(filePath)) {
    res.attachment(filePath);
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
};


exports.filelist = (req, res) => {
    var filelist = getFileList('../Output')
    res.send(filelist)
}

function getFileList(path){
  var filelist = [];
  readFile(path, filelist);
  filelist.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
  return filelist;
}


function readFile(path, filelist){
  var files = fs.readdirSync(path);
  files.forEach(walk);
  function walk(file)
  {
      var state = fs.statSync(path+'/'+file)
      if(state.isDirectory()){
          readFile(path+'/'+file, filelist)
      }else{
          var obj = {
            size: state.size,
            name: file,
            path: path + '/' + file,
            mtime: state.mtime 
        };
        filelist.push(obj);          
      }
  }
}