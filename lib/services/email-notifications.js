import sgMail from "@sendgrid/mail";

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const MILESTONES = {
  VIEWS: [100, 500, 1000, 5000],
  INQUIRIES: [10, 50, 100, 500],
  LISTINGS: [5, 10, 25, 50],
};

export async function checkAndSendMilestoneNotifications(user, stats) {
  if (!user.email) return;

  const milestones = [];

  // Check view milestones
  MILESTONES.VIEWS.forEach((milestone) => {
    if (
      stats.totalViews >= milestone &&
      stats.totalViews - stats.previousViews < milestone
    ) {
      milestones.push(`You've reached ${milestone} total property views!`);
    }
  });

  // Check inquiry milestones
  MILESTONES.INQUIRIES.forEach((milestone) => {
    if (
      stats.totalInquiries >= milestone &&
      stats.totalInquiries - stats.previousInquiries < milestone
    ) {
      milestones.push(`You've received ${milestone} total inquiries!`);
    }
  });

  // Check listing milestones
  MILESTONES.LISTINGS.forEach((milestone) => {
    if (
      stats.activeListings >= milestone &&
      stats.activeListings - stats.previousActiveListings < milestone
    ) {
      milestones.push(`You now have ${milestone} active listings!`);
    }
  });

  if (milestones.length === 0) return;

  try {
    await sgMail.send({
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "TopDial: You've Reached New Milestones! 🎉",
      html: `
        <div>
          <h2>Congratulations ${user.firstName}!</h2>
          <p>You've achieved new milestones on TopDial:</p>
          <ul>
            ${milestones.map((m) => `<li>${m}</li>`).join("")}
          </ul>
          <p>Keep up the great work!</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/agent/stats">
              View Your Stats Dashboard
            </a>
          </p>
        </div>
      `,
    });

    console.log(`Sent milestone notification email to ${user.email}`);
    return true;
  } catch (error) {
    console.error("Error sending milestone notification:", error);
    return false;
  }
}
