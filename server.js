const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');  // API request ke liye

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Ensure uploads folder exists
const uploadPath = 'uploads/';
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

// Serve static files
app.use(express.static(uploadPath));

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 📌 Brevo API Key (ENV me add karna hoga)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_EMAIL = process.env.BREVO_EMAIL;

// Upload Route
app.post('/upload', upload.single('photo'), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const backendUrl = 'https://photo-backend-2nd.onrender.com';
    const photoURL = `${backendUrl}/${req.file.filename}`;

    // 📩 Brevo API email payload
    const emailData = {
        sender: { email: BREVO_EMAIL },
        to: [{ email: BREVO_EMAIL }],
        subject: "New Photo Uploaded",
        htmlContent: `<p>A new photo was uploaded:</p><br><a href="${photoURL}">${photoURL}</a>`
    };

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(emailData)
        });

        const result = await response.json();

        console.log("Brevo API response:", result);

        res.json({
            message: 'Photo uploaded & email sent successfully!',
            filePath: photoURL
        });

    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
