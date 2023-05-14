const nodemailer = require("nodemailer");
require('dotenv').config()
const sendMail = async (subject, body, userMail) => {
  try {
    let testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.sendinblue.com',
      port: 587,
      auth: {
        user: process.env.NODEMAILER_USERNAME,
        pass: process.env.NODEMAILER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    let info = await transporter.sendMail({
      from: 'api-ace@mail.com',
      to: userMail,
      subject: subject,
      text: body,
      html: body,
    });
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.log("mail not working")
    console.log(error)
  }
};

module.exports = { sendMail };