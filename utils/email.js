const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, text,html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject,
            text,
            html
        };

        console.log(`Email sending to ${to}`)
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`)
    } catch (error) {
        console.log(`Getting Error while sending email to ${to}`,error.message);
    }
};

const sendToListOfUsers = (candidates, subject, html) => {
    candidates.forEach((candidate) => {
        sendEmail(candidate.email, subject, "", html);
    })
}

module.exports = {
    sendEmail,
    sendToListOfUsers
}