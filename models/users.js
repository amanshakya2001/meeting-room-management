const { Schema, model } = require("mongoose");
const { generateSalt, hashPassword } = require("../utils/auth");

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        default: "user",
        enum: ["user","manager","admin"],
    },
},{
    timestamps: true,
});

userSchema.pre("save", function (next) {
    if (this.isModified("password")) {
        this.salt = generateSalt();
        this.password = hashPassword(this.password, this.salt);
    }
    next();
});

const User = model("User", userSchema);

module.exports = User;

    
    