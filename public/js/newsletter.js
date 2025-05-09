document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('newsletterForm');
    const messageEl = document.getElementById('newsletterMessage');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const name = form.name.value.trim();
      const email = form.email.value;
      const honeypotValue = form.honeypot.value.trim();
      const acceptance = form.acceptance.checked;
      const csrfToken = form.CSRFToken.value.trim();
  
      try {
        const res = await fetch('/newsletter', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name,
            email: email,
            acceptance: acceptance,
            honeypot: honeypotValue,
            CSRFToken: csrfToken
          })
        });
  
        const data = await res.json();
        
        if (data.success) {
          form.reset()
          form.style.display = 'none';
        }

        messageEl.textContent = data.message;
        messageEl.style.color = data.success ? 'green' : 'red';
      } catch (err) {
        messageEl.textContent = 'Došlo je do greške. Pokušajte ponovo.';
        messageEl.style.color = 'red';
      }
    });
  });
  