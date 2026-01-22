module.exports = {
  uploadToIPFS: async (file) => {
    return "ipfs://fake_hash_" + Date.now();
  }
};
