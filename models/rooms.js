const { Schema, model } = require("mongoose");   

const roomSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
    },
},{
    timestamps: true,
});

const Room = model("Room", roomSchema);

module.exports = Room;
