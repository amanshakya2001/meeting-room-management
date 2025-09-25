const Meeting = require("../models/meetings");
const User = require("../models/users");
const { sendToListOfUsers } = require("../utils/email");
const { buildMeetingEmail } = require("../utils/email-template");

const createMeeting = async (req, res) => {
    try {
        const user = req.id;
        const { reason, startDate, endDate, room, candidates } = req.body;
        if(!reason || !startDate || !endDate || !room || !candidates){
            return res.status(400).json({ error: "All fields are required" });
        }
        let isApproved = false;
        if(["admin","manager"].includes(req.role)){
            isApproved = true;
        }
        const meeting = await Meeting.create({ reason, startDate, endDate, room, candidates, user, isApproved });
        await meeting.populate("user");
        await meeting.populate("candidates");
        await meeting.populate("room");
        if(isApproved){
            const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'created' });
            sendToListOfUsers(meeting.candidates, subject, html);
            createEmailNotification(meeting);
        }
        else{
            let managers = meeting.candidates.filter(c => c.role === "manager");
            let admins = await User.find({ role: "admin" });    
            let listOfUsers = new Set([...managers, ...admins]);
            const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, 
                { appUrl: process.env.DOMAIN, action: 'pending', managers, admins });
            sendToListOfUsers(listOfUsers, subject, html);
        }
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
        const oldMeeting = await Meeting.findById(req.params.id).populate("candidates").populate("room");
        const meeting = await Meeting.findByIdAndUpdate(req.params.id, { reason, startDate, endDate, room, candidates }, { new: true }).populate("user").populate("candidates").populate("room");
        if(oldMeeting.isApproved){
            const removedCandidates = (oldMeeting.candidates || []).filter(oc =>
                !(meeting.candidates || []).some(nc => nc._id?.equals?.(oc._id))
            );
            
            const addedCandidates = (meeting.candidates || []).filter(nc =>
                !(oldMeeting.candidates || []).some(oc => oc._id?.equals?.(nc._id))
            );

            if (removedCandidates.length > 0) {
                const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'candidates_removed', notify: 'removed', removedCandidates });
                sendToListOfUsers(removedCandidates, subject, html);
            }

            if (addedCandidates.length > 0) {
                const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'created' });
                sendToListOfUsers(addedCandidates, subject, html);
            }

            if (removedCandidates.length === 0 && addedCandidates.length === 0) {
                const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'updated' });
                sendToListOfUsers(meeting.candidates, subject, html);
            }
            deleteEmailNotification(oldMeeting);
            createEmailNotification(meeting);
        }
        return res.status(200).json({ meeting });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findByIdAndDelete(req.params.id).populate("candidates").populate("room");
        if(meeting.isApproved){
            const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'cancelled' });
            sendToListOfUsers(meeting.candidates, subject, html);
            deleteEmailNotification(meeting);
        }
        return res.status(200).json({ meeting });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

const approveMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }).populate("user").populate("candidates").populate("room");
        const { subject, html } = buildMeetingEmail(meeting, req.email, meeting.user.email, { appUrl: process.env.DOMAIN, action: 'created' });
        sendToListOfUsers(meeting.candidates, subject, html);
        createEmailNotification(meeting);
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
    deleteMeeting,
    approveMeeting
};