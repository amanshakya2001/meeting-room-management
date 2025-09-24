const Meeting = require("../models/meetings");
const Room =  require("../models/rooms");

const createRoom = async (req, res) => {
    try {
        const { name, capacity } = req.body;
        if(!name || !capacity){
            return res.status(400).json({ error: "All fields are required" });
        }
        const room = await Room.create({ name, capacity });
        return res.status(201).json({ message: "Room created successfully", room });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({});
        return res.status(200).json({ rooms });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        return res.status(200).json({ room });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const updateRoom = async (req, res) => {
    try {
        const { name, capacity } = req.body;
        const room = await Room.findByIdAndUpdate(req.params.id, { name, capacity });
        return res.status(200).json({ room });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        return res.status(200).json({ room });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const checkAvailability = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if(!startDate || !endDate){
            return res.status(400).json({ error: "All fields are required" });
        }
        const bookedRooms = await Meeting.find({
            startDate: { $lt: endDate },   
            endDate: { $gt: startDate }    
          }).distinct("room");
        const availableRooms = await Room.find({ _id: { $nin: bookedRooms } });
        return res.status(200).json({ availableRooms });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { 
    createRoom,
    getAllRooms,
    getRoom,
    updateRoom,
    deleteRoom,
    checkAvailability
};