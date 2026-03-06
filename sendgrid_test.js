import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

(async () => {
  try {
    await sgMail.send({
      to: "teamtest@kickdecktest.testinator.com",
      from: "support@kickdeck.io",
      subject: "Test Email from Shell",
      text: "This is a simple test email sent from the Shell script.",
    });
    console.log("✅ Test email sent successfully");
  } catch (error) {
    console.error(
      "❌ Error sending test email:",
      error.response?.body || error,
    );
  }
})();
