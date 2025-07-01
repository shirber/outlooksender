
const express = require('express');
const multer = require('multer'); // ספרייה שמטפלת בהעלאת קבצים
const cors = require('cors');   // ספרייה שמאפשרת לדפדפן לדבר עם השרת
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors()); 
const UPLOADS_DIR = path.join(__dirname, 'uploads');

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

app.post('/upload', upload.single('attachment'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    res.json({ fileId: req.file.filename });
});

app.get('/download/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const filePath = path.join(UPLOADS_DIR, fileId);
    
    res.download(filePath, fileId, (err) => {
        if (err) {
            res.status(404).send('File not found.');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // בדיקה אם תיקיית ה-uploads קיימת, ואם לא - יוצר אותה
    if (!require('fs').existsSync(UPLOADS_DIR)){
        require('fs').mkdirSync(UPLOADS_DIR);
    }
});
