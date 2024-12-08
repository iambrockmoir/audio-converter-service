const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Check FFmpeg installation
exec('ffmpeg -version', (error, stdout, stderr) => {
    if (error) {
        console.error('FFmpeg not found:', error);
        return;
    }
    console.log('FFmpeg version info:', stdout);
});

app.post('/convert', upload.single('audio'), async (req, res) => {
    // Set a longer timeout
    req.setTimeout(30000);
    res.setTimeout(30000);
    
    const callback_url = req.body.callback_url;
    const from_number = req.body.from_number;
    
    console.log('Received conversion request');
    console.log('Callback URL:', callback_url);
    console.log('From Number:', from_number);
    
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

    // Read and log the file header
    const fileContent = fs.readFileSync(inputPath);
    console.log('File header:', fileContent.slice(0, 6).toString('hex'));

    // Log the full FFmpeg command
    const command = `ffmpeg -f amr -i ${inputPath} -y -acodec libmp3lame -ac 1 -b:a 128k ${outputPath}`;
    console.log('Started ffmpeg with command:', command);

    ffmpeg(inputPath)
        .inputFormat('amr')
        .audioCodec('libmp3lame')
        .audioChannels(1)
        .audioBitrate('128k')
        .on('start', (commandLine) => {
            console.log('Started ffmpeg with command:', commandLine);
        })
        .on('progress', (progress) => {
            console.log('Processing: ', progress.percent, '% done');
        })
        .on('end', async () => {
            console.log('Conversion finished');
            
            try {
                // Read the converted MP3 file
                const mp3File = fs.createReadStream(outputPath);
                
                console.log('Starting OpenAI transcription');
                
                // Transcribe with OpenAI
                const transcription = await openai.audio.transcriptions.create({
                    file: mp3File,
                    model: "whisper-1",
                });
                
                console.log('Transcription completed:', transcription.text);
                
                // Send transcription back to Vercel
                if (callback_url) {
                    console.log('Sending transcription to callback URL:', callback_url);
                    
                    await axios.post(callback_url, {
                        from_number: from_number,
                        transcription: transcription.text
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log('Callback successful');
                }
                
                // Clean up files
                try {
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (e) {
                    console.error('Error cleaning up files:', e);
                }
                
                res.json({ status: 'success', transcription: transcription.text });
            } catch (err) {
                console.error('Error processing audio:', err);
                if (callback_url) {
                    try {
                        await axios.post(callback_url, {
                            from_number: from_number,
                            error: err.message
                        }, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                    } catch (callbackErr) {
                        console.error('Error sending error callback:', callbackErr);
                    }
                }
                res.status(500).json({ error: err.message });
            }
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
});
