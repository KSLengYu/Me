// ========== Supabase 初始化 ==========
const SUPABASE_URL = "https://lhncuzhymmplnbtqiroh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobmN1emh5bW1wbG5idHFpcm9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxODU0NTUsImV4cCI6MjA3ODc2MTQ1NX0.cOdgp2PG7bf3PfF3Gg48e2gOGviM_HGH9KMSiiV3V-o";

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== 登录页面逻辑 ==========
const sendBtn = document.getElementById('sendBtn');
const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('email');
const codeInput = document.getElementById('code');
const msgP = document.getElementById('msg');

let tempCode = '';

if (sendBtn) {
  sendBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
      msgP.textContent = '请输入邮箱';
      return;
    }
    tempCode = Math.floor(100000 + Math.random() * 900000).toString();

    sendBtn.disabled = true;
    msgP.textContent = '发送中...';

    const res = await fetch('/api/sendCode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, code: tempCode })
    });
    const data = await res.json();
    if (data.success) {
      msgP.textContent = '验证码已发送';
    } else {
      msgP.textContent = '发送失败：' + (data.message || '');
    }
    sendBtn.disabled = false;
  });

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const entered = codeInput.value.trim();
    if (entered !== tempCode) {
      msgP.textContent = '验证码错误';
      return;
    }

    // 登录通过，保存邮箱
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userEmail', email);

    // 写入 profiles 表
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ email: email }, { onConflict: ['email'] });
    if (upsertErr) {
      console.error('写入 profiles 失败', upsertErr);
    }

    window.location.href = 'index.html';
  });
}

// ========== 留言板逻辑 ==========
const logged = localStorage.getItem('loggedIn');
if (logged && document.getElementById('messages')) {
  // 在 index.html 上
  const messagesDiv = document.getElementById('messages');
  const sendMsgBtn = document.getElementById('sendMsgBtn');
  const messageInput = document.getElementById('messageInput');

  async function loadMessages() {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('获取留言失败', error);
      return;
    }
    messagesDiv.innerHTML = '';
    data.forEach(msg => {
      const div = document.createElement('div');
      div.className = 'msg';
      div.innerHTML = `<strong>${msg.user_email}</strong><br>${msg.content}`;
      messagesDiv.appendChild(div);
    });
  }
  loadMessages();

  sendMsgBtn.addEventListener('click', async () => {
    const content = messageInput.value.trim();
    if (!content) {
      alert('留言不能为空');
      return;
    }
    const user_email = localStorage.getItem('userEmail') || '';

    const { error } = await supabase
      .from('messages')
      .insert([{ user_email, content }]);
    if (error) {
      alert('发送失败：' + error.message);
    } else {
      messageInput.value = '';
      loadMessages();
    }
  });
} else {
  // 未登录情况
  if (document.getElementById('content')) {
    window.location.href = 'login.html';
  }
}
