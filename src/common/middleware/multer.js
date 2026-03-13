import multer from "multer";

export const cloudMulter = ({ fileExt = [] } = {}) => {
  const storage = multer.diskStorage({});

  function fileFilter(req, file, cb) {
    if (!fileExt.includes(file.mimetype)) {
      return cb(new Error("Invalid File Type"));
    }
    cb(null, true);
  }

  const upload = multer({ storage, fileFilter });
  return upload;
};
