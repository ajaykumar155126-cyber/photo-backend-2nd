const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// Ensure 'uploads' folder exists
const uploadPath = 'uploads/';
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

// Serve static files from 'uploads' folder
app.use(express.static(uploadPath));

// Multer Setup for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Save in 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file
    },
});
const upload = multer({ storage });


// 🔥 Brevo SMTP Mailer (100% working on Render Free)
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_EMAIL,       // SMTP login
        pass: process.env.BREVO_SMTP_KEY,    // SMTP key / password
    },
});


// Route to Upload Photo
app.post('/upload', upload.single('photo'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const backendUrl = 'https://photo-backend-2nd.onrender.com';
    const photoURL = `${backendUrl}/${req.file.filename}`;

    // Email Data
    const mailOptions = {
        from: process.env.BREVO_EMAIL,
        to: process.env.BREVO_EMAIL,
        subject: 'New Photo Uploaded',
        text: `A new photo has been uploaded. View it here: ${photoURL}`,
    };

    // Send Email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        console.log('Email sent:', info.response);

        res.json({
            message: 'Photo uploaded successfully!',
            filePath: photoURL,
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
