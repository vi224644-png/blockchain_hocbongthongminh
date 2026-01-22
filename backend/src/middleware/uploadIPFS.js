const multer = require("multer");

// Lưu file tạm trong memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadIPFS = async (req, res, next) => {
  try {
    if (!req.file) return next();

    // Giả lập upload IPFS
    const fakeIpfsHash = "ipfs://mock_" + Date.now();

    req.ipfsHash = fakeIpfsHash;
    next();
  } catch (err) {
    res.status(500).json({ message: "IPFS upload failed", error: err.message });
  }
};

module.exports = {
  upload,
  uploadIPFS
};
