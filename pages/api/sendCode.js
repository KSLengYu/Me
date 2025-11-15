// pages/api/sendCode.js
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY; // prefer service key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 从环境变量构造邮箱池（支持多网易 + QQ 等）
function buildEmailPool() {
  const pool = [];
  for (let i = 1; i <= 10; i++) { // 支持最多配置 10 个 MAIL_USER_N
    const user = process.env[`MAIL_USER_${i}`];
    const pass = process.env[`MAIL_PASS_${i}`];
    if (user && pass) {
      // 推断 SMTP host（常见网易 / qq / gmail）
      let host = 'smtp.163.com';
      if (user.endsWith('@qq.com')) host = 'smtp.qq.com';
      else if (user.endsWith('@gmail.com')) host = 'smtp.gmail.com';
      pool.push({ user, pass, host });
    }
  }
  return pool;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Only POST' });

  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch(e){ body = req.body; }
  const { email, code: providedCode } = body || {};

  if (!email) return res.status(400).json({ success: false, message: 'email required' });

  // 生成 code（如果前端已传 code 可使用；否则后端生成）
  const code = providedCode || (Math.floor(100000 + Math.random() * 900000).toString());

  // 存储到 Supabase verification_codes 表（expire 5分钟）
  try {
    const expireAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: insertErr } = await supabase
      .from('verification_codes')
      .insert([{ email, code, expire_at: expireAt }]);
    if (insertErr) console.error('verification_codes insert err', insertErr);
  } catch (err) {
    console.error('Supabase insert error', err);
    // 仍继续尝试发邮件，但应记录
  }

  const pool = buildEmailPool();
  if (!pool.length) return res.status(500).json({ success: false, message: 'No mail accounts configured' });

  // 尝试发送：随机选一个，失败则尝试其它（最多尝试 pool.length 次）
  const tried = new Set();
  let lastErr = null;

  for (let attempt = 0; attempt < pool.length; attempt++) {
    const candidate = pickRandom(pool);
    if (tried.has(candidate.user)) continue;
    tried.add(candidate.user);

    const transporter = nodemailer.createTransport({
      host: candidate.host,
      port: 465,
      secure: true,
      auth: { user: candidate.user, pass: candidate.pass },
      // 如果你需要调试可以加 logger: true
    });

    try {
      await transporter.sendMail({
        from: `"留言板" <${candidate.user}>`,
        to: email,
        subject: '留言板登录验证码',
        text: `你的验证码是：${code}\n5分钟内有效。若非本人操作，请忽略。`
      });
      return res.status(200).json({ success: true, message: '验证码已发送' });
    } catch (err) {
      lastErr = err;
      console.warn(`send failed with ${candidate.user}`, err && err.message);
      // 尝试下一个账号
    }
  }

  // 全部失败
  console.error('all mail sends failed', lastErr);
  return res.status(500).json({ success: false, message: '所有邮件发送失败，请稍后重试' });
}
