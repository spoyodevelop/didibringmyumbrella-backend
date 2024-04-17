const nodemailer = require("nodemailer");
const { emailPassword } = require("./majorKeys");

// Gmail SMTP 설정
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "kjy9505@gmail.com",
    pass: emailPassword,
  },
});

// 에러 발생 시 이메일을 보내는 함수
async function sendErrorEmail(error) {
  try {
    // 이메일 내용 설정
    const mailOptions = {
      from: "kjy9505@gmail.com",
      to: "kjy9505@gmail.com",
      subject: "Error occurred in cron job",
      text: `An error occurred in cron job: ${error}`,
    };

    // 이메일 보내기
    await transporter.sendMail(mailOptions);
    console.log("에러 이메일 전송 완료");
  } catch (err) {
    console.error("에러 이메일 전송 중 오류 발생:", err);
  }
}

module.exports = {
  sendErrorEmail,
};
