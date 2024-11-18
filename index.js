const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.post('/convert', upload.single('audio'), (req, res) => {
    console.log('Received conversion request');
    
    if (!req.file) {
        console.log('No file received');
        return res.status(400).send('No audio file uploaded');
    }

    console.log('File details:', {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
    });

    const inputPath = req.file.path;
    const outputPath = path.join('uploads', `${req.file.filename}.mp3`);

    console.log('Converting file...');
    console.log('Input path:', inputPath);
    console.log('Output path:', outputPath);

    ffmpeg(inputPath)
        .toFormat('mp3')
        .on('start', (commandLine) => {
            console.log('Started ffmpeg with command:', commandLine);
        })
        .on('progress', (progress) => {
            console.log('Processing: ', progress.percent, '% done');
        })
        .on('end', () => {
            console.log('Conversion finished');
            res.download(outputPath, 'converted.mp3', (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                }
                // Clean up files
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {
                    console.error('Error cleaning up files:', e);
                }
            });
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            console.error('FFmpeg error message:', err.message);
            res.status(500).send('Conversion failed: ' + err.message);
            try {
                fs.unlinkSync(inputPath);
            } catch (e) {
                console.error('Error cleaning up input file:', e);
            }
        })
        .save(outputPath);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    // Log ffmpeg version
    ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
            console.error('Error getting formats:', err);
        } else {
            console.log('Available formats:', Object.keys(formats));
        }
    });
});

