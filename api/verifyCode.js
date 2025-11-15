// api/verifyCode.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code, realCode } = req.body;

  if (!email || !code || !realCode) {
    return res.status(400).json({ error: "缺少参数" });
  }

  if (code === realCode) {
    return res.status(200).json({ ok: true });
  } else {
    return res.status(400).json({ ok: false, error: "验证码错误" });
  }
}
