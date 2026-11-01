/**
 * submitContact
 * Sends the contact form. Returns { mode: 'api' | 'mailto' } on success and
 * throws on failure, so the form can show an error.
 */
export async function submitContact(values, { endpoint, email }) {
  const payload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    service: values.service,
    email: values.email.trim(),
    message: values.message.trim(),
  };

  if (endpoint) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Contact request failed (${res.status})`);
    return { mode: 'api' };
  }

  const name = `${payload.firstName} ${payload.lastName}`.trim();
  const subject = `Project enquiry: ${payload.service} (${name})`;
  const body = [
    `Name: ${name}`,
    `Email: ${payload.email}`,
    `Service: ${payload.service}`,
    '',
    payload.message || '(no description)',
  ].join('\n');
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { mode: 'mailto' };
}