const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendBulkMessages = async (customers, message) => {
  console.log(`🚀 Starting bulk message send to ${customers.length} customers...`);

  const promises = customers.map(async (customer) => {
    const mobileWithCode = '+91' + customer.mobile;

    // ✅ Send SMS
    try {
      const smsRes = await client.messages.create({
        body: message,
        from: process.env.TWILIO_SMS_FROM,
        to: mobileWithCode
      });
      console.log(`✅ SMS sent to ${mobileWithCode} | SID: ${smsRes.sid}`);
    } catch (err) {
      console.error(`❌ Failed to send SMS to ${mobileWithCode}:`, err.message || err);
    }

    // ✅ Send WhatsApp
    try {
      const whatsappRes = await client.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: 'whatsapp:' + mobileWithCode
      });
      console.log(`✅ WhatsApp sent to ${mobileWithCode} | SID: ${whatsappRes.sid}`);
    } catch (err) {
      console.error(`❌ Failed to send WhatsApp to ${mobileWithCode}:`, err.message || err);
    }
  });

  await Promise.all(promises);
  console.log('📦 All messages attempted. Job complete.');
};

