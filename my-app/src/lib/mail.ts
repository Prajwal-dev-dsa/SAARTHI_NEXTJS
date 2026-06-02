import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email: string, otp: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Saarthi Premium" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Saarthi - Verify Your Email",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #000; color: #fff; border-radius: 16px; text-align: center;">
          <h1 style="margin-bottom: 10px; font-weight: 900; letter-spacing: 2px;">SAARTHI</h1>
          <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 30px;">Premium Vehicle Booking</p>
          
          <div style="background-color: #18181b; padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #27272a;">
            <p style="margin-top: 0; font-size: 16px; color: #e4e4e7;">Your verification code is:</p>
            <h2 style="font-size: 48px; letter-spacing: 8px; margin: 20px 0; color: #fff;">${otp}</h2>
            <p style="margin-bottom: 0; font-size: 14px; color: #a1a1aa;">This code will expire in 10 minutes.</p>
          </div>
          
          <p style="font-size: 12px; color: #71717a;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export const sendRideOtpEmail = async (
  email: string,
  otp: string,
  type: "PICKUP" | "DROP",
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const title =
      type === "PICKUP" ? "Pickup Verification" : "Drop-off Verification";
    const message =
      type === "PICKUP"
        ? "Your driver has arrived! Please share this OTP to start your ride."
        : "You have reached your destination! Please verify this OTP to complete the trip.";

    const mailOptions = {
      from: `"Saarthi Premium" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Saarthi - ${title} Code`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #000; color: #fff; border-radius: 16px; text-align: center;">
          <h1 style="margin-bottom: 10px; font-weight: 900; letter-spacing: 2px;">SAARTHI</h1>
          <p style="color: #a1a1aa; font-size: 16px; margin-bottom: 30px;">${title}</p>
          
          <div style="background-color: #18181b; padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #27272a;">
            <p style="margin-top: 0; font-size: 16px; color: #e4e4e7;">${message}</p>
            <h2 style="font-size: 48px; letter-spacing: 8px; margin: 20px 0; color: #fff;">${otp}</h2>
            <p style="margin-bottom: 0; font-size: 14px; color: #a1a1aa;">This code expires in 15 minutes.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending ride OTP:", error);
    return false;
  }
};
