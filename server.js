const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Ensure uploads folder exists
const uploadPath = 'uploads/';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

app.use(express.static(uploadPath));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Gmail SMTP transporter (100% works on Railway)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Upload route
app.post('/upload', upload.single('photo'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const backendUrl = process.env.BACKEND_URL;
    const photoURL = `${backendUrl}/${req.file.filename}`;

    const mailOptions = {
        from: process.env.GMAIL_EMAIL,
        to: process.env.GMAIL_EMAIL,
        subject: 'New Photo Uploaded',
        text: `A new photo was uploaded:\n${photoURL}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Email Error:", error);
            return res.status(500).json({ error: "Failed to send email" });
        }

        console.log("Email sent:", info.response);
        res.json({
            message: "Photo uploaded & email sent",
            filePath: photoURL
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
