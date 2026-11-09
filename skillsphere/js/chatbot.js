/* ═══════════════════════════════════════════
   chatbot.js — Career Assistant AI chat widget
   Depends on: state.js (API_BASE)
   ═══════════════════════════════════════════ */

function toggleChat() {
  const widget = document.getElementById('chatbot-widget');
  const icon   = document.getElementById('chat-toggle-icon');
  const title  = document.getElementById('chat-title');

  widget.classList.toggle('collapsed');

  if (widget.classList.contains('collapsed')) {
    icon.textContent  = '▲';
    title.innerHTML   = '💬 Chat';
  } else {
    icon.textContent  = '▼';
    title.innerHTML   = '💬 Career Assistant AI';
    document.getElementById('chat-input').focus();
  }
}

function handleChatKeyPress(event) {
  if (event.key === 'Enter') sendChatMessage();
}

function appendMessage(text, sender) {
  const body   = document.getElementById('chatbot-body');
  const msgDiv = document.createElement('div');
  msgDiv.className   = `chat-message ${sender}`;
  msgDiv.textContent = text;
  body.appendChild(msgDiv);
  body.scrollTop = body.scrollHeight;
}

async function sendChatMessage() {
  const input   = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  appendMessage(message, 'user');
  input.value = '';

  // Typing indicator
  const typingId  = 'typing-' + Date.now();
  const body      = document.getElementById('chatbot-body');
  const typingDiv = document.createElement('div');
  typingDiv.className   = 'chat-message bot';
  typingDiv.id          = typingId;
  typingDiv.textContent = 'Thinking...';
  body.appendChild(typingDiv);
  body.scrollTop = body.scrollHeight;

  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message }),
    });
    const data = await response.json();
    document.getElementById(typingId).remove();

    appendMessage(
      response.ok ? data.reply : "Sorry, I'm having trouble connecting right now.",
      'bot'
    );
  } catch (error) {
    document.getElementById(typingId).remove();
    appendMessage('Cannot reach the server. Ensure the backend is running.', 'bot');
  }
}
