const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ Allow your frontend domain to access the backend
app.use(cors({
  origin: 'https://www.modvisorconsultants.com', // Change this to match your frontend domain
  methods: 'GET,POST,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
}));

// ✅ Handle CORS Preflight Requests
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.modvisorconsultants.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Use `/tmp/` because Vercel does not allow writing to other folders
const uploadPath = '/tmp/uploads/';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadPath,
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/api/submit-form', upload.single('resume'), (req, res) => {
  const { name, number, email, subject, message } = req.body;
  const resume = req.file;

  if (!resume) {
    return res.status(400).json({ message: 'Resume file is required' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: `New Submission: ${subject}`,
    text: `Name: ${name}\nNumber: ${number}\nEmail: ${email}\nMessage: ${message}`,
    attachments: [{ filename: resume.originalname, path: resume.path }],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error.message);
      return res.status(500).json({ message: 'Error sending email', error: error.message });
    }
    res.json({ message: 'Form submitted and email sent successfully!' });
  });
});

// Export app instead of using app.listen()
module.exports = app;
