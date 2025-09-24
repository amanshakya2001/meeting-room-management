const Room = require("../models/rooms");
const Users = require("../models/users");
const Meetings = require("../models/meetings");
// homepage controller
const homePage = async (req, res) => {
    let rooms = [];
    let meetings = [];
    let users = [];
    let pastMeetings = [];
    if(req.role === "admin"){
        rooms = await Room.find({});
        users = await Users.find({});
        meetings = await Meetings.find({}).populate("user").populate("room").populate("candidates").sort({ startDate: 1 }).lean().exec();
    }
    else{
        meetings = await Meetings.find({
            $and: [
              {
                $or: [
                  { user: req.id },
                  { candidates: req.id }
                ]
              },
              { startDate: { $gt: new Date() } } 
            ]
          })
            .populate('user')
            .populate('room')
            .populate('candidates')
            .sort({ startDate: 1 }) 
            .lean()
            .exec();

        pastMeetings = await Meetings.find({
            $and: [
              {
                $or: [
                  { user: req.id },
                  { candidates: req.id }
                ]
              },
              { startDate: { $lt: new Date() } } 
            ]
          })
            .populate('user')
            .populate('room')
            .populate('candidates')
            .sort({ startDate: 1 }) 
            .lean()
            .exec();
    }
    meetings = meetings.map((meeting) => {
        return {
            ...meeting,
            startDate: meeting.startDate.toLocaleString(),
            endDate: meeting.endDate.toLocaleString()
        }
    });
    pastMeetings = pastMeetings.map((meeting) => {
        return {
            ...meeting,
            startDate: meeting.startDate.toLocaleString(),
            endDate: meeting.endDate.toLocaleString()
        }
    });
    res.render("home",{
        email: req.email,
        role: req.role,
        rooms,
        meetings,
        users,
        pastMeetings
    });
};

// login page controller
const loginPage = (req, res) => {
    res.render("login",{
        email: req.email,
        role: req.role
    });
};

// signup page controller
const signupPage = (req, res) => {
    res.render("signup",{
        email: req.email,
        role: req.role
    });
}

const createRoomPage = (req, res) => {
    res.render("create-room",{
        email: req.email,
        role: req.role
    });
};

const updateRoomPage = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if(!room){
            res.redirect("/");
        }
        res.render("update-room",{
            email: req.email,
            role: req.role,
            room
        });
    } catch (error) {
        res.redirect("/");
    }
};

const bookMeetingPage = async (req, res) => {
    let rooms = await Room.find({});
    let candidates = await Users.find({});

    candidates = candidates.map((user) => {
        return {
            email: user.email,
            id: user.id
        }
    });
    res.render("book-meeting",{
        rooms,
        candidates,
        email: req.email,
        role: req.role
    });
};

const updateMeetingPage = async (req, res) => {
    try {
        const meeting = await Meetings.findById(req.params.id).populate("user").populate("room").populate("candidates");
        const candidates = await Users.find({});
        const bookedRooms = await Meetings.find({
            startDate: { $lt: meeting.endDate },   
            endDate: { $gt: meeting.startDate }    
          }).distinct("room");
        const availableRooms = await Room.find({ _id: { $nin: bookedRooms } });
        if(!meeting){
            res.redirect("/");
        }
        res.render("update-meeting",{
            email: req.email,
            role: req.role,
            meeting,
            candidates,
            rooms: availableRooms
        });
    } catch (error) {
        res.redirect("/");
    }
};

module.exports = { homePage, loginPage, signupPage, createRoomPage, bookMeetingPage, updateRoomPage, updateMeetingPage };
