(() => {
  const form = document.getElementById("contactForm");
  const submit = document.getElementById("contactSubmit");
  const status = document.getElementById("contactStatus");
  if (!form || !submit || !status) return;

  const endpoint = "https://formsubmit.co/ajax/topium.dev@gmail.com";
  const defaultLabel = submit.innerHTML;

  const setStatus = (message, state = "") => {
    status.textContent = message;
    if (state) status.dataset.state = state;
    else delete status.dataset.state;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const values = new FormData(form);
    if (String(values.get("_honey") || "").trim()) {
      form.reset();
      setStatus("Message sent.", "success");
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("Sending your message…");

    const subject = String(values.get("_subject") || "").trim();
    const payload = {
      name: String(values.get("name") || "").trim(),
      email: String(values.get("email") || "").trim(),
      _subject: subject,
      subject,
      message: String(values.get("message") || "").trim(),
      _template: "table",
      _url: "https://t8pium.github.io/contact/",
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Submission failed");
      }

      form.reset();
      setStatus("Sent. I’ll receive this in my inbox.", "success");
    } catch (error) {
      console.error("Contact form submission failed:", error);
      setStatus(
        "Couldn’t send right now. You can still email topium.dev@gmail.com directly.",
        "error",
      );
    } finally {
      submit.disabled = false;
      submit.innerHTML = defaultLabel;
    }
  });
})();
