
const SYSTEM_PROMPT =
  "Du er en hjelpsom reiseassistent for RunAway – et " +
  "selskap som arrangerer løpeturer til ikoniske " +
  "destinasjoner: Angkor Wat, Tokyo, Tromsø, Honolulu, " +
  "Chamonix og Cape Town. Svar alltid på norsk, vær " +
  "entusiastisk og hjelp gjester med spørsmål om " +
  "destinasjoner, pakker og påmelding. " +
  "Svar alltid i ren tekst uten markdown-formatering. " +
  "Ingen stjerner, hashtagger eller spesialtegn. " +
  "Hold svarene korte og vennlige – maks 3-4 setninger.";
  

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const contactForm = document.getElementById('contactForm');
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-links a');

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    highlightActiveNav();
  });

  // Mobile menu toggle
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu on link click
  navAnchors.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Active nav link on scroll
  function highlightActiveNav() {
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navAnchors.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }

  // Scroll reveal for destination cards
  const cards = document.querySelectorAll('.destination-card');

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  cards.forEach(card => observer.observe(card));

  // Contact form handling
  contactForm.addEventListener('submit', e => {
    e.preventDefault();

    const btn = contactForm.querySelector('.btn-primary');
    const originalText = btn.textContent;

    btn.textContent = 'Melding sendt!';
    btn.style.background = '#2ecc71';
    btn.style.borderColor = '#2ecc71';
    contactForm.reset();

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.borderColor = '';
    }, 3000);
  });

  // ===== Chatbot =====
  const chatWidget = document.getElementById('chatWidget');
  const chatBubble = document.getElementById('chatBubble');
  const chatClose = document.getElementById('chatClose');
  const chatWindow = document.getElementById('chatWindow');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');

  let conversationHistory = [];
  let isOpen = false;
  let isLoading = false;

  const WELCOME_MESSAGE =
    'Hei! 👋 Jeg er RunAway-assistenten. Spør meg om destinasjoner, pakker eller påmelding – jeg hjelper deg gjerne!';

  function toggleChat() {
    isOpen = !isOpen;
    chatWidget.classList.toggle('open', isOpen);
    chatWindow.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      if (chatMessages.children.length === 0) {
        appendMessage('assistant', WELCOME_MESSAGE);
      }
      chatInput.focus();
    }
  }

  chatBubble.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', () => {
    if (isOpen) toggleChat();
  });

  function appendMessage(role, text) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${role}`;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }

  function showLoading() {
    const loader = document.createElement('div');
    loader.className = 'chat-message loading';
    loader.id = 'chatLoader';
    loader.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(loader);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideLoading() {
    const loader = document.getElementById('chatLoader');
    if (loader) loader.remove();
  }

  async function sendMessage(userText) {
    conversationHistory.push({ role: 'user', content: userText });

    isLoading = true;
    chatSend.disabled = true;
    chatInput.disabled = true;
    showLoading();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: conversationHistory,
        }),
      });

      hideLoading();

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API-feil (${response.status})`);
      }

      const data = await response.json();
      const assistantText = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      conversationHistory.push({ role: 'assistant', content: assistantText });
      appendMessage('assistant', assistantText);
    } catch (err) {
      hideLoading();
      conversationHistory.pop();
      appendMessage(
        'assistant',
        'Beklager, noe gikk galt. Sjekk at API-nøkkelen er riktig, og prøv igjen.'
      );
      console.error('Chatbot error:', err.message);
    } finally {
      isLoading = false;
      chatSend.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    if (isLoading) return;

    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';
    sendMessage(text);
  });
});
