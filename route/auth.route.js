const express = require("express");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const { userModel } = require("../model/user.model");
const passportGithub = require("passport");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const authRoute = express.Router();


// Google Oauth
authRoute.get(
    "/google",
    passport.authenticate("google", { scope: ["email", "profile"] })
);
authRoute.get(
    "/google/callback",
    passport.authenticate('google', {
        failureRedirect: '/auth/google/failure',
        session: false
    }),
    function (req, res) {
        let user = req.user;
        const token = jwt.sign({
            userID: user._id,
            username:user.name

        },process.env.secret, { expiresIn: '24hr' });
        res.redirect(`https://apiwizard.netlify.app/dashboard.html?username=${user.name}&userID=${user._id}&token=${token}`); // chnge the link to frontend
    }
);

authRoute.get("/google/failure", (req, res) => {
    res.send("failure")
})

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "https://elegant-moth-zipper.cyclic.app/auth/google/callback", // change the callback link
            passReqToCallback: true
        },
        async function (request, accessToken, refreshToken, profile, cb) {
            let email = profile._json.email;
            let name = profile._json.name;
            let udata = await userModel.findOne({ email });
            if (udata) {
                return cb(null, udata);
            }


            const user = new userModel({
                name,
                email,
                password: uuidv4(),
            });
            await user.save();
            return cb(null, user);
        }
    )
);

// Github Oauth
authRoute.get(
    "/github",
    passportGithub.authenticate("github", { scope: ["user:email"] })
);

authRoute.get(
    "/github/callback",
    passportGithub.authenticate("github", {
        failureRedirect: "/login",
        session: false,
    }),
    function (req, res) {
        let user = req.user;
        const token = jwt.sign({
            userID: user._id
        }, 'token', { expiresIn: '24hr' });
        res.redirect(`https://apiwizard.netlify.app/dashboard.html?username=${user.name}&userID=${user._id}&token=${token}`);
    }
);

authRoute.get("/github/failure", (req, res) => {
    res.send("failure")
})



passportGithub.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: "http://localhost:4500/auth/github/callback",
            scope: "user:email",
        },
        async function (request, accessToken, refreshToken, profile, done) {
            let email = profile.emails[0].value;

            let udata = await userModel.findOne({ email });
            if (udata) {
                return done(null, udata);
            }
            let name = profile._json.name;

            const user = new userModel({
                name,
                email,
                password: uuidv4(),
            });
            await user.save();
            return done(null, user);
        }
    )
);



module.exports = {
    authRoute
}