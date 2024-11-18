const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Check FFmpeg installation and codecs
exec('ffmpeg -codecs', (error, stdout, stderr) => {
    if (error) {
        console.error('Error checking codecs:', error);
        return;
    }
    console.log('Available codecs:', stdout);
});

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

    // Try to read the file header
    const fileContent = fs.readFileSync(inputPath);
    console.log('File content (first 10 bytes):', fileContent.slice(0, 10));

    ffmpeg(inputPath)
        .inputFormat('amr')  // Specify input format
        .audioCodec('libmp3lame')  // Use MP3 encoder
        .audioChannels(1)
        .audioBitrate('128k')
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
            
            // Try direct ffmpeg command for debugging
            exec(`ffmpeg -i ${inputPath}`, (error, stdout, stderr) => {
                console.log('FFmpeg file inspection:', stderr);
            });
            
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
});
