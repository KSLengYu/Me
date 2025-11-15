export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = req.query.email;
  const code = req.query.code;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and code required" });
  }

  if (!globalThis.codes) {
    return res.status(400).json({ error: "No code stored" });
  }

  if (globalThis.codes[email] !== code) {
    return res.status(400).json({ ok: false, msg: "Incorrect code" });
  }

  res.json({ ok: true });
}
