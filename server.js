const http = require('node:http');

const hostname = '127.0.0.1';
const port = 3000;
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const {PDFDocument} = require('pdf-lib');

const app = express();
app.use(express.static('frontend'));
app.use(express.static('css'));
app.use(express.static('img'));

const upload = multer({dest : 'uploads/'});

app.post('/upload', upload.single('pdf'), async (req, res) => {
	try{
		const pdfPath = req.file.path;
		const pdfName = req.file.originalname;
		const fileBytes = fs.readFileSync(pdfPath);

		const pdfDoc = await PDFDocument.load(fileBytes);
		const pages = pdfDoc.getPages();

		for(const page of pages){
			const {width, height} = page.getSize();
			page.setSize(width * 0.7, height * 0.7);
		}

		const resizedPdfBytes = await pdfDoc.save();
		const ouputPath = pdfName + '-resized.pdf';
		fs.writeFileSync(ouputPath, resizedPdfBytes);

		res.download(ouputPath, ouputPath, () => {
			fs.unlinkSync(pdfPath);
			fs.unlinkSync(ouputPath);
		});		
	}catch(err){
		console.error(err);
		res.status(500).send('Lỗi xử lý File PDF');
	}
});

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});