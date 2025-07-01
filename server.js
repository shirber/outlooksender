// server.js

// ייבוא הספריות הנדרשות
const express = require('express');
const multer = require('multer'); // ספרייה שמטפלת בהעלאת קבצים
const cors = require('cors');   // ספרייה שמאפשרת לדפדפן לדבר עם השרת
const path = require('path');

const app = express();
const PORT = 3000;

// הגדרות
app.use(cors()); // מאפשר בקשות מכל מקור
const UPLOADS_DIR = path.join(__dirname, 'uploads'); // יצירת תיקייה לשמירת הקבצים

// הגדרת Multer לשמירת קבצים עם שם ייחודי
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'attachment-' + uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

// "כתובת" שאליה הדפדפן שולח את הקובץ
app.post('/upload', upload.single('attachment'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    // השרת מחזיר לדפדפן את השם הייחודי של הקובץ שנוצר
    res.json({ fileId: req.file.filename });
});

// "כתובת" שממנה תוכנת ה-C# מבקשת להוריד את הקובץ
app.get('/download/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const filePath = path.join(UPLOADS_DIR, fileId);
    
    res.download(filePath, fileId, (err) => {
        if (err) {
            res.status(404).send('File not found.');
        }
    });
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // בדיקה אם תיקיית ה-uploads קיימת, ואם לא - יוצר אותה
    if (!require('fs').existsSync(UPLOADS_DIR)){
        require('fs').mkdirSync(UPLOADS_DIR);
    }
});