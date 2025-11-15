let realCode = ""; // 后端返回的真实验证码

document.getElementById("send").onclick = async () => {
  const email = document.getElementById("email").value;

  const res = await fetch("/api/sendCode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (data.ok) {
    alert("验证码已发送");
    realCode = data.code;
  } else {
    alert("发送失败：" + data.error);
  }
};

document.getElementById("login").onclick = async () => {
  const email = document.getElementById("email").value;
  const code = document.getElementById("code").value;

  const res = await fetch("/api/verifyCode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, realCode }),
  });

  const data = await res.json();

  if (data.ok) {
    alert("登录成功！");
    window.location.href = "/index.html";
  } else {
    alert("验证码错误");
  }
};
