const IPFS = require('ipfs-http-client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create IPFS client
const ipfs = IPFS.create({
    host: process.env.IPFS_HOST || 'ipfs.infura.io',
    port: process.env.IPFS_PORT || 5001,
    protocol: process.env.IPFS_PROTOCOL || 'https',
    headers: {
        authorization: `Bearer ${process.env.IPFS_PROJECT_SECRET}`
    }
});

// @desc    Upload file to IPFS
// @param   file - File object from multer
// @return  IPFS hash
const uploadToIPFS = async (file) => {
    try {
        if (!file) {
            throw new Error('No file provided');
        }

        // Read file content
        const fileContent = fs.readFileSync(file.path);
        
        // Add file to IPFS
        const result = await ipfs.add({
            path: file.originalname,
            content: fileContent
        });

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        return result.cid.toString();

    } catch (error) {
        console.error('IPFS upload error:', error);
        throw new Error('Failed to upload file to IPFS');
    }
};

// @desc    Upload JSON data to IPFS
// @param   data - JSON data to upload
// @return  IPFS hash
const uploadJSONToIPFS = async (data) => {
    try {
        const buffer = Buffer.from(JSON.stringify(data));
        const result = await ipfs.add(buffer);
        
        return result.cid.toString();

    } catch (error) {
        console.error('IPFS JSON upload error:', error);
        throw new Error('Failed to upload JSON to IPFS');
    }
};

// @desc    Get file from IPFS
// @param   hash - IPFS hash
// @return  File content
const getFromIPFS = async (hash) => {
    try {
        const chunks = [];
        for await (const chunk of ipfs.cat(hash)) {
            chunks.push(chunk);
        }
        
        return Buffer.concat(chunks);

    } catch (error) {
        console.error('IPFS get error:', error);
        throw new Error('Failed to retrieve file from IPFS');
    }
};

// @desc    Pin file to IPFS (make it persistent)
// @param   hash - IPFS hash
const pinToIPFS = async (hash) => {
    try {
        await ipfs.pin.add(hash);
        console.log(`File ${hash} pinned successfully`);
    } catch (error) {
        console.error('IPFS pin error:', error);
        throw new Error('Failed to pin file to IPFS');
    }
};

// @desc    Unpin file from IPFS
// @param   hash - IPFS hash
const unpinFromIPFS = async (hash) => {
    try {
        await ipfs.pin.rm(hash);
        console.log(`File ${hash} unpinned successfully`);
    } catch (error) {
        console.error('IPFS unpin error:', error);
        throw new Error('Failed to unpin file from IPFS');
    }
};

module.exports = {
    uploadToIPFS,
    uploadJSONToIPFS,
    getFromIPFS,
    pinToIPFS,
    unpinFromIPFS
};