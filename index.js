const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No audio file uploaded');
    }

    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `${req.file.filename}.mp3`);

    ffmpeg(inputPath)
        .toFormat('mp3')
        .on('end', () => {
            // Send the converted file
            res.download(outputPath, 'converted.mp3', () => {
                // Clean up files after sending
                fs.unlinkSync(inputPath);
                fs.unlinkSync(outputPath);
            });
        })
        .on('error', (err) => {
            console.error('Error:', err);
            res.status(500).send('Conversion failed');
            fs.unlinkSync(inputPath);
        })
        .save(outputPath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});