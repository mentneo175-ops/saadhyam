(function() {
  // Find current script tag to extract host domain & configurations
  const scriptTag = document.currentScript || (function() {
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  if (!scriptTag) {
    console.error('[Saadhyam Live Chat] Loader script tag not found.');
    return;
  }

  const scriptSrc = scriptTag.src;
  const saadhyamUrl = new URL(scriptSrc).origin;
  const pluginKey = scriptTag.getAttribute('data-plugin-key');

  if (!pluginKey) {
    console.error('[Saadhyam Live Chat] Missing data-plugin-key attribute on the script tag.');
    return;
  }

  // Create container div to hold the widget iframe
  const container = document.createElement('div');
  container.id = 'saadhyam-live-chat-container';
  
  // Set default button layout styles
  const defaultStyles = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '80px',
    height: '80px',
    zIndex: '999999',
    border: 'none',
    background: 'transparent',
    overflow: 'hidden',
    transition: 'width 0.2s ease, height 0.2s ease, bottom 0.2s ease, right 0.2s ease, left 0.2s ease'
  };

  Object.assign(container.style, defaultStyles);

  // Create the widget iframe
  const iframe = document.createElement('iframe');
  iframe.src = saadhyamUrl + '/live-chat/widget?plugin_key=' + encodeURIComponent(pluginKey);
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('scrolling', 'no');

  container.appendChild(iframe);
  document.body.appendChild(container);

  let chatOpen = false;
  let chatPosition = 'bottom_right'; // default position

  // Responsive utility function
  function updateDimensions() {
    if (chatOpen) {
      if (window.innerWidth < 640) {
        // Mobile fullscreen layout
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.bottom = '0';
        container.style.right = '0';
        container.style.left = '0';
      } else {
        // Desktop window layout
        container.style.width = '420px';
        container.style.height = '620px';
        container.style.bottom = '20px';
        if (chatPosition === 'bottom_left') {
          container.style.left = '20px';
          container.style.right = 'auto';
        } else {
          container.style.right = '20px';
          container.style.left = 'auto';
        }
      }
    } else {
      // Small circular trigger button layout
      container.style.width = '80px';
      container.style.height = '80px';
      container.style.bottom = '20px';
      if (chatPosition === 'bottom_left') {
        container.style.left = '20px';
        container.style.right = 'auto';
      } else {
        container.style.right = '20px';
        container.style.left = 'auto';
      }
    }
  }

  // Handle resize events for responsiveness
  window.addEventListener('resize', updateDimensions);

  // Listen for iframe postMessages to dynamically adjust sizes/positions
  window.addEventListener('message', function(event) {
    if (event.origin !== saadhyamUrl) return;

    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'saadhyam-chat-toggle') {
      chatOpen = !!data.open;
      updateDimensions();
    } else if (data.type === 'saadhyam-chat-position') {
      chatPosition = data.position === 'bottom_left' ? 'bottom_left' : 'bottom_right';
      updateDimensions();
    }
  });
})();
