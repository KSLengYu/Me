import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// -----------------------------
//  Supabase
// -----------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// -----------------------------
//  邮箱池（随机选择）
// -----------------------------
const emailPool = [
  {
    host: "smtp.163.com",
    port: 465,
    secure: true,
    user: process.env.EMAIL_163_1,
    pass: process.env.EMAIL_163_1_PASS
  },
  {
    host: "smtp.163.com",
    port: 465,
    secure: true,
    user: process.env.EMAIL_163_2,
    pass: process.env.EMAIL_163_2_PASS
  },
  {
    host: "smtp.163.com",
    port: 465,
    secure: true,
    user: process.env.EMAIL_163_3,
    pass: process.env.EMAIL_163_3_PASS
  },
  {
    host: "smtp.163.com",
    port: 465,
    secure: true,
    user: process.env.EMAIL_163_4,
    pass: process.env.EMAIL_163_4_PASS
  },
  {
    host: "smtp.163.com",
    port: 465,
    secure: true,
    user: process.env.EMAIL_163_5,
    pass: process.env.EMAIL_163_5_PASS
  },
  {
    host: "smtp.qq.com",
    port: 465,
    secure: true,
    user: process.env.EMAIL_QQ,
    pass: process.env.EMAIL_QQ_PASS
  }
];

// 随机选择一个邮箱
function getRandomEmail() {
  const index = Math.floor(Math.random() * emailPool.length);
  return emailPool[index];
}

// -----------------------------
//  发送验证码
// -----------------------------
app.post("/send-code", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.json({ ok: false, msg: "缺少 email" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 随机选一个邮箱发送
  const sender = getRandomEmail();
  const transporter = nodemailer.createTransport({
    host: sender.host,
    port: sender.port,
    secure: sender.secure,
    auth: { user: sender.user, pass: sender.pass }
  });

  try {
    await transporter.sendMail({
      from: sender.user,
      to: email,
      subject: "您的验证码",
      text: `您的验证码是：${code}`,
    });

    // 存入 Supabase
    await supabase.from("verification_codes").insert({
      email,
      code,
      created_at: new Date()
    });

    res.json({ ok: true, msg: "验证码已发送" });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, msg: "发送失败" });
  }
});

// -----------------------------
//  验证验证码是否正确
// -----------------------------
app.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) return res.json({ ok: false, msg: "缺少参数" });

  const { data, error } = await supabase
    .from("verification_codes")
    .select("*")
    .eq("email", email)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || data.length === 0) {
    return res.json({ ok: false, msg: "验证码错误" });
  }

  res.json({ ok: true, msg: "验证成功" });
});

// -----------------------------
app.listen(3000, () => {
  console.log("服务器已运行在 http://localhost:3000");
});
