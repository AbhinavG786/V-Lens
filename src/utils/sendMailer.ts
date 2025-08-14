import transporter from "./nodemailer";
import { generateEmailTemplate } from "./emailTemplate";

class SendMailer {
  sendVerificationEmail = async (email: string, data: { token: string }) => {
    const options = {
      from: process.env.EMAIL_USER,
      // from:process.env.RESEND_EMAIL,
      to: email,
      subject: "Verify your email",
      html: generateEmailTemplate("verification", data),
    };
    try {
      const info = await transporter.sendMail(options);
      return info;
    } catch (err) {
      console.error("Error sending email:", err);
      throw new Error("Failed to send email");
    }
  };

  sendPasswordResetMail=async(email:string,data:{resetUrl:string})=>{
    const options = {
      from: process.env.EMAIL_USER,
      // from:process.env.RESEND_EMAIL,
      to: email,
      subject: "Reset your password by following the link below",
      html: generateEmailTemplate("passwordReset",data),
    };
    try {
      const info = await transporter.sendMail(options);
      return info;
    } catch (err) {
      console.error("Error sending email:", err);
      throw new Error("Failed to send email");
    }
  }

  sendInsufficientStockUpdate = async (
    data: { productId: string; currentStock: number; threshold: number }
  ) => {
    const options = {
      from: process.env.EMAIL_USER,
      // from:process.env.RESEND_EMAIL,
      to: process.env.RESEND_EMAIL,
      subject: "Insufficient Stock Update",
      html: generateEmailTemplate("insufficientStock", data),
    };
    try {
      const info = await transporter.sendMail(options);
      return info;
    } catch (err) {
      console.error("Error sending email:", err);
      throw new Error("Failed to send email");
    }
  }

}

export default new SendMailer();
