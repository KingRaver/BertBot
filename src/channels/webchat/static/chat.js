const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");

const protocol = window.location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${window.location.host}`);

socket.addEventListener("message", (event) => {
  appendMessage("gateway", event.data);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    return;
  }
  socket.send(JSON.stringify({ type: "text", text }));
  appendMessage("you", text);
  input.value = "";
});

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}
