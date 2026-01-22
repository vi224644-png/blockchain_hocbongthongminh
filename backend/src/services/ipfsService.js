const uploadFileToIPFS = async (file) => {
  if (!file) return null;

  // giả lập IPFS hash
  const fakeHash = "ipfs://mock_" + Date.now();
  return fakeHash;
};

module.exports = {
  uploadFileToIPFS
};
