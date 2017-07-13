var Users = require("../models/users").Users;
const bcrypt = require("bcryptjs");

var authenticate = async(req, res, next) => {
    try {
        var result;
        result = await Users.findOne({
            email: req.body.email
        });
        if (!result) {
            req.user = "";
            next();
        }
        let passwordMatch;
        passwordMatch = await bcrypt.compare(req.body.password, result.password);
        if (!passwordMatch) {
            req.user = "";
            next();
        }
        req.user = result;
        next();
    } catch (e) {
        console.log("something went wrong with authentication.js", e);
    }
};




module.exports.authenticate = authenticate;
