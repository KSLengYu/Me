import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "你的 supabase url";
const SUPABASE_KEY = "你的 supabase anon key";

// 连接数据库
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 你的邮箱池（随机自动使用）
const emailPool = [
  { user: "lengyuxh2@163.com", pass: "YXCHz3AyKbeXds6b" },
  { user: "lengyuxh1@163.com", pass: "FLCTw899QMDtwskN" },
  { user: "LengYuTTKX@163.com", pass: "QKCWpezFfvb6xCEr" },
  { user: "oklejiarenmen@163.com", pass: "BTCaGZFJeSC6ptxN" },
  { user: "ly666ccb@163.com", pass: "JECf37iN8Ugik6dJ" },

  // QQ 邮箱（如果你之后补密码我也能加）
  // { user: "xxx@qq.com", pass: "你的授权码" },
];

/**
 * 获取一个随机邮箱
 */
function getRandomEmail() {
  const index = Math.floor(Math.random() * emailPool.length);
  return emailPool[index];
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ msg: "Only POST allowed" });
  }

  const { email } = JSON.parse(req.body);

  if (!email) {
    return res.status(400).json({ msg: "email required" });
  }

  // 生成 6 位验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // 保存 Supabase
  await db.from("verification_codes").insert({
    email,
    code,
    expire_at: new Date(Date.now() + 5 * 60 * 1000)  // 5 分钟后过期
  });

  // 选择邮箱
  const sender = getRandomEmail();

  // 构造 SMTP 客户端
  const transporter = nodemailer.createTransport({
    host: "smtp.163.com",
    port: 465,
    secure: true,
    auth: sender
  });

  // 发送邮件
  try {
    await transporter.sendMail({
      from: sender.user,
      to: email,
      subject: "你的验证码",
      text: `你的登录验证码是：${code}\n5分钟内有效`
    });

    return res.status(200).json({ msg: "验证码已发送" });
  } catch (err) {
    return res.status(500).json({ msg: "发送失败", error: err.toString() });
  }
}
