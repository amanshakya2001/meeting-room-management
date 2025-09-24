// custom import
const User = require("../models/users");
const { comparePassword, generateToken } = require("../utils/auth");

// get user details
const getUser = async (req, res) => {
    if(!req.email){
        return res.status(400).json({ isLogin:false });
    }
    const user = await User.findOne({ email: req.email });
    if(!user){
        return res.status(400).json({ isLogin:false });
    }
    return res.json({
        email:user.email,
        fullname:user.fullname,
        isLogin:true
    });
}

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// login api controller
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }
    if (!comparePassword(password, user.password, user.salt)) {
        return res.status(400).json({ error: "Incorrect password" });
    }
    const token = generateToken({ email, id: user._id, role: user.role });
    return res.cookie("token", token).json({ message: "Login successful" });
}

// signup api controller
const signup = async (req, res) => {
    const { fullname, email, password } = req.body;
    if (!fullname || !email || !password) {
        return res.status(400).json({ error: "Fullname, email and password are required" });
    }
    const user = await User.create({ fullname, email, password });
    const token = generateToken({ email, id: user._id, role: user.role });
    return res.cookie("token", token).status(201).json({ message: "User created successfully" });
}

// logout api controller
const logout = (req, res) => {
    res.clearCookie("token").redirect("/login");
}

const updateRole = async (req, res) => {
    const { email, role } = req.body;
    if (!email || !role) {
        return res.status(400).json({ error: "Email and role are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }
    user.role = role;
    await user.save();
    return res.json({ message: "User updated successfully" });
}

module.exports = { 
    login, 
    signup,
    logout,
    getUser,
    getAllUsers,
    updateRole
 };
