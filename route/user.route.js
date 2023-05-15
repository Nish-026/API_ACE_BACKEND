const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
require("dotenv").config();
const { sendMail } = require("../middleware/mail.middleware");
let userRoute = express.Router();
const { userModel } = require("../model/user.model");
const passport = require("../config/google_oauth");
const saltRounds=8
const salt = bcrypt.genSaltSync(saltRounds);

userRoute.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  let userData = await userModel.find({ email });
  if (userData.length > 0) {
    res.status(400);
    res.send("user already exists");
  } else {
    bcrypt.hash(password, salt, async function (err, hash) {
      if (err) {
        console.log(err)
        res.status(400);
        res.send("something went wrong");
      } else {
        let userRegisterData = userModel({
          name,
          email,
          password: hash,
        });
        await userRegisterData.save();
        let sub = `Welcome to API ACE`;
        let body = `Dear ${name},

                This is Greeting from API ACE, Welcomes you to our app! We are thrilled to have you join our community and we hope that you will find our app to be a valuable tool for your needs.
                
                Our app has been designed to be user-friendly and intuitive, with a range of features and functions.
                
                Thank you again for choosing API ACE and we hope you enjoy using our app!
                
                Best regards,
                API ACE`;
        sendMail(sub, body, email);
        res.send("user registered");
      }
    });
  }
});



userRoute.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let userData = await userModel.find({ email });
  if (userData.length > 0) {
    bcrypt.compare(password, userData[0].password, function (err, result) {
      if (result) {
        var token = jwt.sign(
          { name: userData[0].name, userID: userData[0]._id },
          process.env.secret
        );

        res.send({
          msg: "login successful",
          token: token,
          username: userData[0].name,
          userID: userData[0]._id,
        });
      } else {
        res.status(400);
        res.send({ msg: "wrong credentials" });
      }
    });
  } else {
    res.status(404);
    res.send({ msg: "wrong credentials" });
  }
});


userRoute.post("/logout",async (req, res) => {
  const token = req.headers.authorization;
  const blackListData = JSON.parse(
    fs.readFileSync("blacklist.token.json", "utf-8")
  );
  blackListData.push(token);
  fs.writeFileSync("blacklist.token.json", JSON.stringify(blackListData));
  res.status(200).send("logout successful");
});

userRoute.post("/otp", async (req, res) => {
  const email = req.body.email;
  try {
    const userData = await userModel.find({ email });
    if (userData.length > 0) {
      let otp = Math.floor(Math.random() * 9000 + 1000);
      let sub = `OTP for resetting the API ACE Password`;
      let body = `This is Your OTP - ${otp} for resetting the API ACE password, Keep it confedential.`;
      sendMail(sub, body, email);
      res.send({
        ok: true,
        message: otp,
      });
    } else {
      res.send({
        message: "Incorrect E-Mail",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400);
    res.send("something went wrong while sending otp");
  }
});

userRoute.patch("/reset", async (req, res) => {
  try {
    const payload = req.body;

    const email = payload.email;
    const password = payload.password;

    const userData = await userModel.find({ email });

    if (userData.length > 0) {
      const ID = userData[0]._id;
      bcrypt.hash(password, 3, async function (err, hashed) {
        const edited = { password: hashed };
        await userModel.findByIdAndUpdate({ _id: ID }, edited);
        res.status(200).send({
          ok: true,
          message: "Password Re-Set Successfully",
        });
      });
    } else {
      res.send({ message: "Incorrect Email" });
    }
  } catch (error) {
    console.log(error);
    res.status(400);
    res.send("something went wrong while resetting password");
  }
});


module.exports = { userRoute };
