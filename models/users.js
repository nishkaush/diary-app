const mongoose = require("mongoose");
const validator = require("validator");

mongoose.connect(process.env.MONGODB_URI || process.env.localDb);

mongoose.Promise = global.Promise;

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(value) {
                return validator.isEmail(value);
            }
        },
        message: "Email Aint Valid"
    },
    password: {
        type: String,
        required: true
    },
    resetPasswordToken: {
        type: String
    },
    tokenExpires: {
        type: Number
    }
});


var Users = mongoose.model("Users", userSchema);

module.exports.Users = Users;
