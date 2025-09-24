const Meeting = require("../models/meetings");
const { sendToListOfUsers } = require("../utils/email");
const { buildMeetingEmail } = require("../utils/email-template");

const createMeeting = async (req, res) => {
    try {
        const user = req.id;
        const { reason, startDate, endDate, room, candidates } = req.body;
        if(!reason || !startDate || !endDate || !room || !candidates){
            return res.status(400).json({ error: "All fields are required" });
        }
        const meeting = await Meeting.create({ reason, startDate, endDate, room, candidates, user });
        meeting.populate("candidates").populate("room");
        const { subject, html } = buildMeetingEmail(meeting, req.email, { appUrl: process.env.DOMAIN, action: 'created' });
        sendToListOfUsers(meeting.candidates, subject, html);
        return res.status(201).json({ message: "Meeting created successfully", meeting });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getAllMeetings = async (req, res) => {
    try {
        const meetings = await Meeting.find({});
        return res.status(200).json({ meetings });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const getMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        return res.status(200).json({ meeting });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const updateMeeting = async (req, res) => {
    try {
        const { reason, startDate, endDate, room, candidates } = req.body;
        const meeting = await Meeting.findByIdAndUpdate(req.params.id, { reason, startDate, endDate, room, candidates }).populate("candidates").populate("room");
        const { subject, html } = buildMeetingEmail(meeting, req.email, { appUrl: process.env.DOMAIN, action: 'updated' });
        sendToListOfUsers(meeting.candidates, subject, html);
        return res.status(200).json({ meeting });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findByIdAndDelete(req.params.id).populate("candidates").populate("room");;
        const { subject, html } = buildMeetingEmail(meeting, req.email, { appUrl: process.env.DOMAIN, action: 'cancelled' });
        sendToListOfUsers(meeting.candidates, subject, html);
        return res.status(200).json({ meeting });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { 
    createMeeting,
    getAllMeetings,
    getMeeting,
    updateMeeting,
    deleteMeeting
};