// api/sendCode.js

import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "缺少邮箱" });
  }

  // 邮箱池（自动过滤空账号）
  const mailPool = [
    { user: process.env.MAIL_USER_1, pass: process.env.MAIL_PASS_1 },
    { user: process.env.MAIL_USER_2, pass: process.env.MAIL_PASS_2 },
    { user: process.env.MAIL_USER_3, pass: process.env.MAIL_PASS_3 },
    { user: process.env.MAIL_USER_4, pass: process.env.MAIL_PASS_4 },
    { user: process.env.MAIL_USER_5, pass: process.env.MAIL_PASS_5 },
    { user: process.env.MAIL_USER_6, pass: process.env.MAIL_PASS_6 }, // QQ
  ].filter(x => x.user && x.pass);

  // 随机取一个邮箱发邮件
  const selected = mailPool[Math.floor(Math.random() * mailPool.length)];

  // 网易邮箱 = smtp.163.com
  const transporter = nodemailer.createTransport({
    host: selected.user.includes("@qq.com") ? "smtp.qq.com" : "smtp.163.com",
    port: 465,
    secure: true,
    auth: {
      user: selected.user,
      pass: selected.pass,
    },
  });

  // 生成验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await transporter.sendMail({
      from: selected.user,
      to: email,
      subject: "你的验证码",
      text: `你的验证码是：${code}，有效期 5 分钟`,
    });

    return res.status(200).json({ ok: true, code });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err.toString(),
    });
  }
}
