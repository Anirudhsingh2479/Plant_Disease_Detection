const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, uploadDir);
    },
    filename : function (req,file,cb){
        const safeExt = path.extname(file.originalname || '').toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

module.exports = upload;