// Email Notification Service for Student Data Submissions & Governance Rejections
import emailjs from '@emailjs/browser';

/**
 * Sends a rejection notification email to the student email address using EmailJS.
 * 
 * @param {Object} params
 * @param {string} params.studentEmail - The email address of the student who submitted the entry
 * @param {string} params.plotName - Plot identification name (e.g. R1T1, Plot A)
 * @param {string} params.locationName - Location name (e.g. College, Athani, Anthiyur)
 * @param {string} params.feedback - Detailed admin feedback explaining the rejection
 * @param {string|number} params.submissionId - Unique record ID
 */
export async function sendRejectionNotification({
  studentEmail,
  plotName,
  locationName,
  feedback,
  submissionId,
}) {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn("[Email Notification Service] EmailJS credentials not configured in .env. Falling back to mailto.");
    
    // Fallback to mailto link
    const subject = encodeURIComponent(`URGENT: Revision Required for Sugarcane Field Data (${locationName} - ${plotName})`);
    const body = encodeURIComponent(`Hello,\n\nYour recent data submission for ${locationName} (Plot: ${plotName}, ID: #${submissionId}) requires revision.\n\nAdmin Feedback:\n"${feedback}"\n\nPlease correct these values and resubmit.\n\nThank you.`);
    window.location.href = `mailto:${studentEmail}?subject=${subject}&body=${body}`;
    
    return { success: false, message: "EmailJS credentials missing. Used mailto fallback." };
  }

  const templateParams = {
    to_email: studentEmail,
    location_name: locationName,
    plot_name: plotName,
    submission_id: submissionId,
    feedback: feedback,
  };

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );
    console.log("[Email Notification Service] Email sent successfully!", response.status, response.text);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("[Email Notification Service] Failed to send email:", error);
    
    // Fallback to mailto link
    const subject = encodeURIComponent(`URGENT: Revision Required for Sugarcane Field Data (${locationName} - ${plotName})`);
    const body = encodeURIComponent(`Hello,\n\nYour recent data submission for ${locationName} (Plot: ${plotName}, ID: #${submissionId}) requires revision.\n\nAdmin Feedback:\n"${feedback}"\n\nPlease correct these values and resubmit.\n\nThank you.`);
    window.location.href = `mailto:${studentEmail}?subject=${subject}&body=${body}`;
    
    return { success: false, message: "Failed to send email. Used mailto fallback." };
  }
}
