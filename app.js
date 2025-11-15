import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://你的ProjectID.supabase.co';
const SUPABASE_ANON_KEY = '你的-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const userInfoDiv = document.getElementById('user-info');
const messagesDiv = document.getElementById('messages');
const sendBtn = document.getElementById('send-btn');
const msgText = document.getElementById('msg-text');

// 读取登录信息
const social_uid = localStorage.getItem('social_uid');
const nickname = localStorage.getItem('nickname');
const avatar_url = localStorage.getItem('avatar_url');

if (social_uid) {
  userInfoDiv.innerHTML = `<img src="${avatar_url}"><span>${nickname}</span>`;
  // 登录用户信息写入 profiles 表（如果不存在就插入）
  (async () => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('social_uid', social_uid)
      .limit(1);
    
    if (!existing || existing.length === 0) {
      const { error } = await supabase
        .from('profiles')
        .insert([{ social_uid, nickname, avatar_url }]);
      if (error) console.error('写入 profiles 失败', error);
    }
  })();
}

// 获取留言列表
async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('获取留言失败', error);
    return;
  }
  messagesDiv.innerHTML = '';
  data.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message';
    div.innerHTML = `<strong>${msg.nickname || '匿名'}:</strong> ${msg.text}`;
    messagesDiv.appendChild(div);
  });
}
loadMessages();

// 发布留言
sendBtn.addEventListener('click', async () => {
  const text = msgText.value.trim();
  if (!text) return alert('留言不能为空');

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      text,
      social_uid: social_uid || '',
      nickname: nickname || '匿名',
      avatar_url: avatar_url || ''
    }]);
    
  if (error) {
    console.error('发布失败', error);
    alert('发布失败');
  } else {
    msgText.value = '';
    loadMessages();
  }
});
