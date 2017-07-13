require("dotenv").config({
    path: "myvariables.env"
});
const port = process.env.PORT || process.env.NODE_ENV;


const express = require("express");
const fs = require("fs");
const hbs = require("hbs");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const session = require("express-session"); //used for creating sessions obj
const bodyParser = require("body-parser");
const ObjectID = require('mongodb').ObjectID;
const mongoose = require("./models/entries").mongoose;
var Entries = require("./models/entries").Entries;
var Users = require("./models/users").Users;
const path = require("path");
const flash = require('connect-flash');
const nodemailer = require("nodemailer");
const juice = require("juice");
const htmlToText = require("html-to-text");
const crypto = require("crypto");
var authenticate = require("./middleware/authenticate").authenticate;


var app = express();

const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(flash());

hbs.registerPartials(__dirname + "/views/partials");

app.set("view engine", "hbs");

var transport = nodemailer.createTransport({
    host: process.env.mailHost,
    port: process.env.mailPort,
    auth: {
        user: process.env.mailUser,
        pass: process.env.mailPassword
    }
});

// ###################Cookie Creation middleware########
app.use(session({
    secret: process.env.cookie_Secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        name: "signup/login-cookie"
    }
}));



// ################## Main login page ########
app.get("/", (req, res) => {
    if (req.session.email) {
        req.session.destroy();
        return res.render("login");
    }
    res.render("login", {
        message: req.flash("info")
    });
});


// ###################signup session creation########

app.post("/signup", async(req, res) => {

    try {
        if (req.body.password) {
            var password;
            let salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(req.body.password, salt);

            var newUser = new Users({
                username: req.body.username,
                email: req.body.email,
                password: password
            });

            var result = await newUser.save();
            req.session.email = result.email;
            req.flash("homeinfo", `WELCOME ${result.username.toUpperCase()}!`);
            res.redirect("/home");
        } else {
            throw new Error("password is needed!");
        }

    } catch (e) {
        console.log("Signing up Error", e);
        req.flash("info", "That Email is taken, please try a different one");
        res.redirect("/");
    }
});


// ###################login session creation########

app.post("/login", authenticate, async(req, res) => {
    // first authenticate, and then redirect
    try {
        if (!req.user) {
            req.flash("info", "Incorrect Login Details, Please Try Again");
            return res.redirect("/");
        } else {
            req.session.email = req.user.email;
            req.flash("homeinfo", `Welcome ${req.user.username.toUpperCase()}`);
            return res.redirect("/home");
        }

    } catch (e) {
        console.log("error while logging in", e);
        req.flash("info", "Login details are incorrect");
        res.redirect("/");
    }
});



// ###################Getting Home Page After Login/ Signup########

app.get("/home", async(req, res) => {

    if (req.session.email) {
        var userEntry;
        try {
            var currentUser = await Users.findOne({
                email: req.session.email
            });
            await Entries.find({
                user: currentUser._id
            }).then((data) => {
                if (data) {
                    userEntry = data;
                } else {
                    console.log(userEntry);
                }
            }).catch((e) => {
                console.log(e);
            });
            await res.render("home", {
                entry: userEntry,
                flashmessage: req.flash("homeinfo")
            });
        } catch (e) {
            console.log("errors in getting homepage with entries from db", e);
        }

    } else {
        console.log("no authority to access home page");
        req.flash("info", "Your session expired, please login again");
        res.redirect("/");
    }

});



// ###########Posting to Homepage after creating new entry################

app.post("/home", async(req, res) => {

    if (req.session.email) {

        try {
            // find the user using req.session.email
            var currentUser = await Users.findOne({
                email: req.session.email
            });

            var newEntry = new Entries({
                title: req.body.title,
                bodytext: req.body.bodytext,
                time: Date.now(),
                user: currentUser._id
            });

            await newEntry.save().then((resp) => {
                res.status(200).redirect("/home");
            });

        } catch (e) {
            console.log("errors while posting new entry", e);
            req.flash("homeinfo", "errors while saving new entry, try again");
            res.redirect("/home");
        }

    } else {
        console.log("You don't have authority, can't post shit");
        req.flash("info", "Your session has expired, please login again");
        res.redirect("/");
    }

});



// ###############Route for Creating new entry########

app.get("/create", async(req, res) => {

    if (req.session.email) {
        try {
            // using juice to integrate style tag ie inline it with html
            // var inlinecss = await
            // new Promise((resolve, reject) => {
            //     juice.juiceFile("./email.html", {}, (err, html) => {
            //         if (err) {
            //             reject(err);
            //         }
            //         resolve(html);
            //     });
            // });

            // using html-to-text to convert juice html into a string
            // var mytext = await new Promise((resolve, reject) => {
            //     htmlToText.fromFile("./email.html", {}, (err, text) => {
            //         if (err) {
            //             reject(err);
            //         }
            //         resolve(text);
            //     });
            // });

            // var myOptions = {
            //     from: "lola@lola.com",
            //     to: "kaushish.nishant@yahoo.com.au",
            //     subject: "My First Ever Email",
            //     text: mytext,
            //     html: inlinecss
            // };

            // var result = await transport.sendMail(myOptions);
            // console.log(result);
            return res.render("create");
        } catch (e) {
            console.log("error while accesing create page", e);
            req.flash("homeinfo", "errors while accessing create page, try again later");
        }
    } else {
        console.log("can't create anything either, no authority");
        req.flash("info", "Your session has expired, please login again");
        res.redirect("/");
    }

});



// ###############Route for Deleting entry########

app.get("/delete/:id", async(req, res) => {

    var id = req.params.id;
    if (req.session.email) {

        try {
            await Entries.findOneAndRemove({
                _id: id
            });
            await res.status(200).redirect("/home");
        } catch (e) {
            console.log("errors with deleting the entry", e);
            req.flash("homeinfo", "errors deleting the entry, please try again");
        }

    } else {
        console.log("can't delete, access authority denied");
        req.flash("info", "Your session has expired, please login again");
        res.redirect("/");
    }

});



// ###############Route for Updating entry########

app.get("/update/:id", (req, res) => {

    // checking req.session.email to see if cookie is still valid
    // Did put email property on the session-object, when accessing homepage after successful login
    // this ensured our session always had an email property,
    // if cookie expired then session expired
    // however, when cookie expires, potentially a new sesssion starts, which won't have an email property associated with it until we login again to get to the home page.
    if (req.session.email && ObjectID.isValid(req.params.id)) {

        Entries.findOne({
            _id: req.params.id
        }).then((entry) => {
            if (!entry) {
                req.flash("homeinfo", "The entry you are trying to edit, doesn't exist");
                res.redirect("/home");
            }
            let title = entry.title;
            let bodytext = entry.bodytext;
            return res.render("update", {
                title: title,
                bodytext: bodytext
            });
        }).catch((e) => {
            console.log("ERROR IN GET UPDATE PATH", e);
            req.flash("homeinfo", "Can't edit that entry, please try again later");
        });

    } else {
        console.log("you don't have authority to update");
        req.flash("info", "Your session has expired, please login again");
        res.redirect("/");
    }

});




// ###############Route for Posting Updated entry########

app.post("/update/:id", async(req, res) => {

    if (req.session.email && ObjectID.isValid(req.params.id)) {

        id = req.params.id;
        try {
            var result = await Entries.findOneAndUpdate({
                _id: id
            }, {
                $set: {
                    title: req.body.title,
                    bodytext: req.body.bodytext
                }
            });
            await res.status(200).redirect("/home");
        } catch (e) {
            console.log("actual error while posting updated template", e);
            req.flash("homeinfo", "Couldn't save changes to that entry, please try again later");
            res.redirect("/home");
        }

    } else {
        console.log("can't post updates now, authority needed");
        req.flash("info", "Your session has expired, please login again");
        res.redirect("/");
    }

});




// ###############Route for logging out########

app.get("/logout", async(req, res) => {

    if (req.session.email) {
        try {
            req.session.destroy();
            console.log("logging out now...");
            await res.redirect("/");
        } catch (e) {
            console.log("error while logging out", e);
            req.flash("homeinfo", "error has occured while trying to logout, please close the browser to exit the app");
            res.redirect("/home");
        }

    } else {
        console.log("You don't have authority to logout");
        req.flash("info", "Your session has expired, please login again");
        res.redirect("/");
    }
});




// ###############Route for forgotten password########
app.get("/forgot", (req, res) => {
    res.render("forgot");
});

app.post("/forgot", async(req, res) => {

    // check if the email provided, exists in the database,
    // if it doesn't, throw an error and keep showing forgot page
    // if email exists, add resetPasswordToken and tokenExpires properties
    // for a random token generation, use crypto
    // create the link /forgot/resetPasswordToken
    // email the link to the user
    // create GET request for /forgot/resetPasswordToken
    // Extract token and check its time validity
    // if all good, then render a page with password, confirm password fields
    // On submission,remove previous password, hash new one and save it
    // redirect to another page showing all is well
    // Or auto-redirect to Home Page with a flash message of success

    try {
        var foundUser = await Users.findOne({
            email: req.body.forgottenEmail
        });

        if (!foundUser) {
            return res.render("forgot", {
                message: "No Account exists with that email"
            });
        }
        var resetPasswordToken = await new Promise((resolve, reject) => {
            crypto.randomBytes(20, (err, data) => {
                if (err) {
                    reject(err);
                }
                let hextoken = data.toString("hex");
                resolve(hextoken);
            });
        });

        foundUser.resetPasswordToken = resetPasswordToken;
        foundUser.tokenExpires = Date.now() + 3600000

        await foundUser.save();
        // http://localhost:3000
        //
        // not using juice since can't auto-inject the url of the reset link
        var mailOptions = {
            from: "Admin",
            to: req.body.forgottenEmail,
            subject: "Reset Password",
            text: `Copy and paste the following link into your browser to reset the password, https://arcane-bayou-67806.herokuapp.com/reset/${resetPasswordToken}`,
            html: `<h1>Reset Password</h1><a href="https://arcane-bayou-67806.herokuapp.com/reset/${resetPasswordToken}" target="_blank">Click Here to Reset</a`
        };

        let result = await transport.sendMail(mailOptions);
        console.log(result);

        res.render("emailsent", {
            message: "Instructions on how to reset your password have been sent to the email address you specified"
        });

    } catch (e) {
        console.log("error in the try block", e);
        req.flash("info", "Error while trying to email new password, please try again");
        res.redirect("/");
    }

});


app.get("/reset/:token", async(req, res) => {
    try {
        var token = req.params.token;
        var tokenTime = Date.now();

        var myUser = await Users.findOne({
            resetPasswordToken: token
        });

        if (myUser && (myUser.tokenExpires > tokenTime)) {
            return res.render("resetpassword");
        }
        var newUser = await Users.findOneAndUpdate({
            resetPasswordToken: token
        }, {
            $unset: {
                resetPasswordToken: "",
                tokenExpires: ""
            }
        });
        req.flash("info", "Your Password reset has expired, please request another one");
        res.redirect("/");

    } catch (e) {
        req.flash("info", "something went wrong while resetting the password, please request another one");
        res.redirect("/");
    }

});

app.post("/reset/:token", async(req, res) => {
    // make sure both fields match --> new password, confirm password
    // hash the new password
    // replace old password with the new one
    // update the user - unset token, token-expire fields, redirect to home

    try {
        if (req.body.newpassword !== req.body.confirmedPassword) {
            return res.render("resetpassword", {
                message: "Both Passwords must match"
            });
        }

        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.newpassword, salt);
        if (!hash) {
            return res.send("Internal Error, please try again later");
        }

        var newUser = await Users.findOneAndUpdate({
            resetPasswordToken: req.params.token
        }, {
            $set: {
                password: hash
            },
            $unset: {
                resetPasswordToken: "",
                tokenExpires: ""
            }
        }, {
            new: true
        });

        if (!newUser) {
            return res.render("/resetpassword", {
                message: "Couldn't save the new password, try again"
            });
        }

        req.flash("info", "Passwords successfully changed, Login now");
        res.redirect("/");

    } catch (e) {
        console.log("some shit went sideways in try block", e);
        req.flash("info", "something went wrong while resetting password, try again later");
        res.redirect("/");
    }
});



app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
