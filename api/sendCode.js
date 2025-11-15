const nodemailer = require("nodemailer");

const accounts = [
  { host: process.env.SMTP_HOST_1, user: process.env.SMTP_USER_1, pass: process.env.SMTP_PASS_1 },
  { host: process.env.SMTP_HOST_2, user: process.env.SMTP_USER_2, pass: process.env.SMTP_PASS_2 },
  { host: process.env.SMTP_HOST_3, user: process.env.SMTP_USER_3, pass: process.env.SMTP_PASS_3 },
  { host: process.env.SMTP_HOST_4, user: process.env.SMTP_USER_4, pass: process.env.SMTP_PASS_4 },
  { host: process.env.SMTP_HOST_5, user: process.env.SMTP_USER_5, pass: process.env.SMTP_PASS_5 },
  { host: process.env.SMTP_HOST_QQ, user: process.env.SMTP_USER_QQ, pass: process.env.SMTP_PASS_QQ }
];

function pickRandomAccount() {
  return accounts[Math.floor(Math.random() * accounts.length)];
}

function createTransporter(account) {
  return nodemailer.createTransport({
    host: account.host,
    port: 465,
    secure: true,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const email = req.query.email;
  if (!email) return res.status(400).json({ ok: false, error: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Sending code ${code} to ${email}`);

  try {
    const account = pickRandomAccount();
    const transporter = createTransporter(account);

    await transporter.sendMail({
      from: account.user,
      to: email,
      subject: "你的验证码",
      text: `你的验证码是：${code}，有效期 5 分钟`,
    });

    global.codes = global.codes || {};
    global.codes[email] = code;

    console.log(`Email sent successfully via ${account.user}`);
    res.status(200).json({ ok: true });

  } catch (err) {
    console.error("SMTP send error:", err);
    res.status(500).json({ ok: false, error: "Send failed: " + (err.message || "Unknown error") });
  }
};
