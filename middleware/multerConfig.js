import multer from 'multer';

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, 'data/images');
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, 'data/videos');
    } else {
      cb(null, 'data/others'); 
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'video/mp4',
    'video/mkv',
    'video/webm'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter
});

export default upload;
