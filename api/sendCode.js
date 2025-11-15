import nodemailer from "nodemailer";

// 定义所有邮箱账号
const accounts = [
  { host: process.env.SMTP_HOST_1, user: process.env.SMTP_USER_1, pass: process.env.SMTP_PASS_1 },
  { host: process.env.SMTP_HOST_2, user: process.env.SMTP_USER_2, pass: process.env.SMTP_PASS_2 },
  { host: process.env.SMTP_HOST_3, user: process.env.SMTP_USER_3, pass: process.env.SMTP_PASS_3 },
  { host: process.env.SMTP_HOST_4, user: process.env.SMTP_USER_4, pass: process.env.SMTP_PASS_4 },
  { host: process.env.SMTP_HOST_5, user: process.env.SMTP_USER_5, pass: process.env.SMTP_PASS_5 },
  { host: process.env.SMTP_HOST_QQ, user: process.env.SMTP_USER_QQ, pass: process.env.SMTP_PASS_QQ }
];

// 随机选择一个邮箱账号
function pickRandomAccount() {
  return accounts[Math.floor(Math.random() * accounts.length)];
}

// 创建 Nodemailer transporter
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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = req.query.email;
  if (!email) return res.status(400).json({ error: "Email required" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Sending Code:", code);

  try {
    const account = pickRandomAccount();
    const transporter = createTransporter(account);

    await transporter.sendMail({
      from: account.user,
      to: email,
      subject: "你的验证码",
      text: `你的验证码是：${code}，有效期 5 分钟`,
    });

    // 临时存储 code
    globalThis.codes = globalThis.codes || {};
    globalThis.codes[email] = code;

    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Send failed" });
  }
}
