/**
 * Peace Corps AI Chatbot - Embeddable Widget Script
 *
 * Usage: Add the following to any page on peacecorps.gov:
 * <script src="https://chatbot.peacecorps.gov/embed.js" defer></script>
 *
 * Configuration (optional, add before the script tag):
 * <script>
 *   window.PeaceCorpsChatConfig = {
 *     apiUrl: 'https://chatbot.peacecorps.gov',
 *     position: 'bottom-right',  // or 'bottom-left'
 *     language: 'en',            // default language
 *     theme: 'default',          // or 'compact'
 *   };
 * </script>
 *
 * Compatible with Django 5/Wagtail 8 CMS (peacecorps.gov)
 * Section 508 accessible
 * FedRAMP High compliant
 */
(function() {
  'use strict';

  var config = window.PeaceCorpsChatConfig || {};
  var API_URL = config.apiUrl || window.location.origin;
  var POSITION = config.position || 'bottom-right';
  var DEFAULT_LANG = config.language || 'en';

  // Don't load if already loaded
  if (document.getElementById('pc-chatbot-widget')) return;

  // Create iframe container
  var container = document.createElement('div');
  container.id = 'pc-chatbot-widget';
  container.setAttribute('role', 'complementary');
  container.setAttribute('aria-label', 'Peace Corps AI Chatbot');
  container.style.cssText = 'position:fixed;' +
    (POSITION === 'bottom-left' ? 'left:20px;' : 'right:20px;') +
    'bottom:20px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;';

  // Create chat button
  var button = document.createElement('button');
  button.id = 'pc-chat-toggle';
  button.setAttribute('aria-label', 'Open Peace Corps chatbot');
  button.setAttribute('aria-expanded', 'false');
  button.style.cssText = 'width:64px;height:64px;border-radius:50%;background:#1a2e5a;color:white;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;transition:all 0.3s;';
  button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

  button.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
  button.onmouseout = function() { this.style.transform = 'scale(1)'; };

  // Create chat iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'pc-chat-iframe';
  iframe.src = API_URL + '/?embed=true&lang=' + DEFAULT_LANG;
  iframe.title = 'Peace Corps AI Chatbot';
  iframe.setAttribute('aria-label', 'Peace Corps chatbot conversation');
  iframe.style.cssText = 'width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:none;margin-bottom:16px;background:white;';
  iframe.setAttribute('loading', 'lazy');

  // Handle responsive
  function updateSize() {
    if (window.innerWidth < 480) {
      iframe.style.width = (window.innerWidth - 16) + 'px';
      iframe.style.height = (window.innerHeight - 100) + 'px';
      iframe.style.borderRadius = '12px';
    } else {
      iframe.style.width = '400px';
      iframe.style.height = '600px';
      iframe.style.borderRadius = '16px';
    }
  }
  window.addEventListener('resize', updateSize);

  var isOpen = false;
  button.addEventListener('click', function() {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.setAttribute('aria-expanded', isOpen.toString());
    button.setAttribute('aria-label', isOpen ? 'Close Peace Corps chatbot' : 'Open Peace Corps chatbot');
    button.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

    if (isOpen) {
      updateSize();
      iframe.focus();
    }
  });

  // Keyboard support
  button.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      iframe.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
      button.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
      button.focus();
    }
  });

  container.appendChild(iframe);
  container.appendChild(button);
  document.body.appendChild(container);
})();
