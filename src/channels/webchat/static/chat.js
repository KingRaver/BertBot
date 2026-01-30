const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const status = document.getElementById("status");
const clientId = getOrCreateClientId();

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${window.location.host}`);

function setStatus(text, isOk) {
  status.textContent = text;
  status.classList.toggle("ok", Boolean(isOk));
}

socket.addEventListener("open", () => {
  setStatus("online", true);
});

socket.addEventListener("close", () => {
  setStatus("offline", false);
});

socket.addEventListener("message", (event) => {
  const data = String(event.data ?? "");
  try {
    const payload = JSON.parse(data);
    if (payload.type === "message") {
      appendMessage("bert", payload.text);
      return;
    }
    if (payload.type === "error") {
      appendMessage("error", payload.error);
      return;
    }
  } catch (error) {
    appendMessage("gateway", data);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    return;
  }
  socket.send(JSON.stringify({ type: "text", text, userId: clientId, channel: "webchat" }));
  appendMessage("you", text);
  input.value = "";
});

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.innerHTML = `<span>${sender}</span><p>${escapeHtml(text)}</p>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function getOrCreateClientId() {
  const key = "bertbot_client_id";
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const fallback = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const generated = window.crypto?.randomUUID ? window.crypto.randomUUID() : fallback;
  localStorage.setItem(key, generated);
  return generated;
}
