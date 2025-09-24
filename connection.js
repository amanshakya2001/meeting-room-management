const mongoose = require("mongoose");

const dbConnect = () => {
    mongoose.connect(process.env.MONGO_URL);
}

module.exports = dbConnect;
