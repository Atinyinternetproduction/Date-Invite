module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { date, time, food } = request.body || {};

  if (!date || !time || !food) {
    response.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL;
  const fromEmail = process.env.FROM_EMAIL;

  if (!resendApiKey || !toEmail || !fromEmail) {
    response.status(500).json({ error: 'Missing email environment variables' });
    return;
  }

  const text = `🎉 New Date Response!
📅 Date: ${date}
⏰ Time: ${time}
🍕 Food Choice: ${food}`;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: 'New Date Response',
        text
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      response.status(500).json({
        error: `Resend failed: ${resendResponse.status} ${errorText}`
      });
      return;
    }

    response.status(200).json({ ok: true });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
};
