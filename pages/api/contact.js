import {
  sendSuccess,
  sendServerError,
  sendValidationError,
} from "../../lib/api-response";
import { validateForm, ValidationSchemas } from "../../lib/validation";
import { withErrorHandling } from "../../lib/api-utils";

const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Validate form data
    const { errors, isValid } = validateForm(
      req.body,
      ValidationSchemas.contact
    );

    if (!isValid) {
      return sendValidationError(res, errors);
    }

    const { name, email, subject, message } = req.body;

    // Here you would implement your email sending logic
    // For example, using nodemailer or a service like SendGrid

    // For now, we'll simulate a successful message submission
    console.log("Contact form submission:", { name, email, subject, message });

    // Send success response
    return sendSuccess(
      res,
      { submitted: new Date().toISOString() },
      "Message received successfully. We will contact you shortly.",
      200
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return sendServerError(res, error);
  }
};

export default withErrorHandling(handler);
