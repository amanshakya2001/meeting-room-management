const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;

const generateSalt = () => {
    return crypto.randomBytes(16).toString("hex");
};

const hashPassword = (password, salt) => {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return hash;
};

const comparePassword = (password, hash, salt) => {
    const hashPassword = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return hashPassword === hash;
};

const generateToken = (payload) => {
    return jwt.sign(payload, secretKey);
};

const verifyToken = (token) => {
    return jwt.verify(token, secretKey);
};

module.exports = {
    generateSalt,
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
};  