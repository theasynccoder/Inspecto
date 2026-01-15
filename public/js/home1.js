
// ...existing code...

// Chatbot popup logic
document.addEventListener('DOMContentLoaded', function() {
    const chatbotBtn = document.getElementById('open-chatbot-btn');
    const chatbotPopup = document.getElementById('food-chatbot-popup');
    const closeChatbot = document.getElementById('close-chatbot');
    const sendBtn = document.getElementById('send-chatbot');
    const input = document.getElementById('chatbot-input');
    const messages = document.getElementById('chatbot-messages');

    chatbotBtn.addEventListener('click', () => {
        chatbotPopup.style.display = 'flex';
    });
    closeChatbot.addEventListener('click', () => {
        chatbotPopup.style.display = 'none';
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.style.marginBottom = '10px';
        // Use marked.js to render markdown as HTML for bot responses
        if (sender === 'Bot' && window.marked) {
            msgDiv.innerHTML = `<b>${sender}:</b> ` + marked.parse(text);
        } else {
            msgDiv.innerHTML = `<b>${sender}:</b> ${text}`;
        }
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    sendBtn.addEventListener('click', async () => {
        const prompt = input.value.trim();
        if (!prompt) return;
        appendMessage(prompt, 'You');
        input.value = '';
        appendMessage('Thinking...', 'Bot');
        try {
            const res = await fetch('/api/food-chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            const data = await res.json();
            messages.lastChild.remove(); // Remove 'Thinking...'
            appendMessage(data.response, 'Bot');
        } catch (err) {
            messages.lastChild.remove();
            appendMessage('Error getting response.', 'Bot');
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendBtn.click();
    });
});
