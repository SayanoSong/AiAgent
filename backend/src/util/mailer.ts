import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp.qq.com
  port: parseInt(process.env.EMAIL_PORT || "465"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // 使用授权码而不是邮箱密码
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const mailOptions = {
      from: `"Your Application" <${process.env.EMAIL_FROM}>`,
      ...options,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${options.to}`);
    console.log(options.text);
    return true;
  } catch (error) {
    console.error("Sending email failed:", error);
    return false;
  }
};

export default sendEmail;
