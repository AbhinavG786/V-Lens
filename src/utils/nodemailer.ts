import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// const transporter = nodemailer.createTransport({
//   host: "smtp.resend.com",
//   port: 587, // 587 for TLS, 465 for SSL
//   secure: false, // true if using port 465
//   auth: {
//     user: "resend", // Resend requires "resend" literally as username
//     pass: process.env.RESEND_API_KEY, // Your API key from Resend dashboard
//   },
// });

export default transporter;
