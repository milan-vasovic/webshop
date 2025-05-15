document.addEventListener("DOMContentLoaded", () => {
  const activateCouponBtn = document.getElementById("activateCouponBtn");
  const couponInput = document.getElementById("couponInput");
  const feedbackContainer = document.getElementById("couponFeedback");
  
  // Preuzimanje CSRF tokena i honeypot vrednosti iz forme:
  const csrfToken = document.querySelector('input[name="CSRFToken"]').value;
  const honeypotValue = document.querySelector('input[name="honeypot"]').value; // Obično ostaje prazan

  activateCouponBtn.addEventListener("click", async () => {
    const couponValue = couponInput.value.trim();
    if (!couponValue) {
      if (feedbackContainer) {
        feedbackContainer.textContent = "Molimo unesite kupon.";
      }
      return;
    }

    try {
      const response = await fetch("/prodavnica/provera-kupona", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coupon: couponValue,
          honeypot: honeypotValue,
          CSRFToken: csrfToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (feedbackContainer) {
          feedbackContainer.textContent = errorData.error || "Greška pri aktivaciji kupona.";
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        // Ispis poruke unutar h2 taga
        if (feedbackContainer) {
          feedbackContainer.innerHTML = `<h2>${data.message || "Kupon je uspešno aktiviran!"}</h2>`;
        }
        
        // Ubaci ili ažuriraj skriveno input polje s _id-jem kupona u glavnoj formi za porudžbinu
        // Pretpostavljamo da glavna forma ima klase "main-form width-100"
        const mainOrderForm = document.querySelector('form.main-form.width-100');
        if (mainOrderForm) {
          let couponIdInput = mainOrderForm.querySelector('input[name="couponId"]');
          if (!couponIdInput) {
            couponIdInput = document.createElement("input");
            couponIdInput.type = "hidden";
            couponIdInput.name = "couponId";
            mainOrderForm.appendChild(couponIdInput);
          }
          couponIdInput.value = data.couponId; // Server vraća _id kupona
        }
        
        // Ažuriraj prikaz ukupne cene: precrtana originalna cena i nova cena sa popustom
        // Pretpostavljamo da element s id "totalPrice" sadrži tekst npr. "1234 RSD"
        // i da server vraća popust u procentima u data.discount (npr. 15 za 15%)
        const totalPriceElement = document.getElementById("totalPrice");
        if (totalPriceElement && data.discount) {
          // Preuzmi originalnu cenu iz elementa (npr. "1234 RSD")
          let oldTotalText = totalPriceElement.innerText; 
          // Izvuci broj iz stringa (uklanjamo sve osim brojeva i tačke)
          let oldTotal = parseFloat(oldTotalText.replace(/[^\d\.]/g, ''));
          let discountPercent = parseFloat(data.discount);
          let newTotal = oldTotal * (1 - discountPercent / 100);
          newTotal = newTotal.toFixed(2);
          // Ažuriraj element: prikaži precrtanu originalnu cenu i novu cenu
          totalPriceElement.innerHTML = `<s>${oldTotalText}</s> ${newTotal} RSD`;
        }
        
        // Sakrij formu za kupon da se ne menja ponovo
        const couponForm = activateCouponBtn.closest("form");
        if (couponForm) {
          couponForm.style.display = "none";
        }
      } else {
        if (feedbackContainer) {
          feedbackContainer.textContent = data.message || "Kupon nije validan.";
        }
      }
    } catch (error) {
      if (feedbackContainer) {
        feedbackContainer.textContent = "Došlo je do greške. Pokušajte ponovo.";
      }
    }
  });
});
