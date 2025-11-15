// pages/api/checkCode.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success:false, message:'Only POST' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch(e){ body = req.body; }
  const { email, code } = body || {};
  if (!email || !code) return res.status(400).json({ success:false, message:'email and code required' });

  try {
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) { console.error(error); return res.status(500).json({ success:false, message:'db error' }); }
    if (!data || data.length === 0) return res.status(400).json({ success:false, message:'验证码错误或不存在' });

    const record = data[0];
    const now = new Date();
    if (new Date(record.expire_at) < now) {
      return res.status(400).json({ success:false, message:'验证码已过期' });
    }

    // login success -> upsert profile
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ email }, { onConflict: ['email'] });

    if (upsertErr) console.error('profiles upsert err', upsertErr);

    // 可选：删除该验证码记录或标记为已用
    await supabase.from('verification_codes').delete().eq('id', record.id);

    return res.status(200).json({ success:true, message:'验证通过' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, message:'服务器错误' });
  }
}
