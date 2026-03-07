import multer from "multer";

export const cloudMulter = ({ fileExt = [] } = {}) => {
  const storage = multer.memoryStorage();

  function fileFilter(req, file, cb) {
    if (!fileExt.includes(file.mimetype)) {
      return cb(new Error("Invalid File Type"));
    }
    cb(null, true);
  }

  return multer({ storage, fileFilter });
};