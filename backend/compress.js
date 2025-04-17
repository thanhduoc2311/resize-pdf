'use strict';

const { PDFNet } = require('@pdftron/pdfnet-node'); 

const fs = require('fs');
const express = require("express");
var path = require("path")

//Compress function
async function runOptimizer(filename, quality, DPI){
  const input_path = '../upload/';
  const output_path = "../Output/";
  console.log(filename +' Start compress!!')
  
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  await PDFNet.initialize("demo:1743846449810:613f578c03000000004e7018a291d4b97e912990fdbf2a2fb97d2918b0");
  
  let Quality = parseInt(quality);
  let D = parseInt(DPI);

  if(Quality <= 0){
    Quality = 1;
  }
  if(Quality > 10){
    Quality = 10;
  }
  if(D <= 0){
    D = 50;
  }

  try {
    const doc = await PDFNet.PDFDoc.createFromFilePath(input_path + filename + ".pdf");
    await doc.initSecurityHandler();
    const image_settings = new PDFNet.Optimizer.ImageSettings();

    image_settings.setCompressionMode(PDFNet.Optimizer.ImageSettings.CompressionMode.e_jpeg);
    image_settings.setQuality(Quality);
    image_settings.setImageDPI(500, D);
    image_settings.forceRecompression(true);

    const opt_settings = new PDFNet.Optimizer.OptimizerSettings();
    opt_settings.setColorImageSettings(image_settings);
    opt_settings.setGrayscaleImageSettings(image_settings);

    await PDFNet.Optimizer.optimize(doc, opt_settings);

    doc.save(output_path + nameWithoutExt + "_resize.pdf", PDFNet.SDFDoc.SaveOptions.e_linearized);

    setTimeout(() => { fs.unlinkSync(input_path + filename + ".pdf"); }, 2000);
    console.log(filename + " compressed!");
  } catch (err) {
    console.log(err);
  }
}
// PDFNet.runWithCleanup(runOptimizer, 0).then(function(){PDFNet.shutdown();});

exports.Compress = runOptimizer;

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
        
        // Sau khi nén xong mới chuyển hướng tải file
        res.send(`<html>
                <body>
                  <script>
                    alert("File is uploaded and compressed successfully!Filesize: ${fileSize}");
                    setTimeout(function(){
                      var a = document.createElement("a");
                      a.href = "/download?path=Output/${nameWithoutExt}_resize.pdf";
                      a.download = "${nameWithoutExt}_resize.pdf";
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(function() {
                        window.location.href = "/";
                      }, 2000); 
                    }, 1000);
                  </script>
                </body>
              </html>`);

      } else {
        fs.unlinkSync('../upload/' + filename);   
        res.send(`<script>
          alert("The type of file is not valid, please send a PDF file!!");
          setTimeout(function(){window.location.href = "/";}, 1000);
        </script>`);
      }
    });
  } else {
    res.send(`<script>
      alert("No file uploaded, please choose a file !");
      setTimeout(function(){window.location.href = "/";}, 1000);
    </script>`);
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
exports.delete = (req, res, next) => {
  var filePath = req.body.filePath;
  console.log('delete file：'+filePath)
  try {
      fs.unlinkSync(filePath)
      // 重定向到列表页
      res.send('success')
  } catch (error) {
      res.send('failed!!')
  }
} 

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
          var obj = new Object;
          obj.size = state.size;
          obj.name = file;
          obj.path = path+'/'+file;
          filelist.push(obj);
      }
  }
}