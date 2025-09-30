import logger from '../utils/logger';

interface BookingNotification {
  booking: any;
  brand: string;
  documentUrls?: string[];
}

class NotificationService {
  /**
   * Send booking confirmation via email and SMS
   */
  async sendBookingConfirmation(data: BookingNotification): Promise<void> {
    try {
      // Send email
      await this.sendEmail(data);

      // Send SMS
      await this.sendSMS(data.booking.customerPhone, this.formatSMSMessage(data.booking));

      logger.info(`Notifications sent for booking ${data.booking.id}`);
    } catch (error) {
      logger.error('Failed to send notifications:', error);
      // Don't throw - notifications shouldn't break the booking process
    }
  }

  /**
   * Send cancellation notification
   */
  async sendCancellationNotification(bookingId: string, _reason?: string): Promise<void> {
    try {
      // Implementation for cancellation notification
      logger.info(`Cancellation notification sent for booking ${bookingId}`);
    } catch (error) {
      logger.error('Failed to send cancellation notification:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(data: BookingNotification): Promise<void> {
    // In production, integrate with SMTP or SendGrid
    const emailContent = this.formatEmailContent(data);
    logger.info('Email would be sent:', emailContent);

    // Placeholder for actual email sending
    // await emailClient.send({
    //   to: data.booking.customerEmail,
    //   subject: 'Booking Confirmation',
    //   html: emailContent
    // });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // In production, integrate with Twilio
    logger.info(`SMS would be sent to ${phoneNumber}: ${message}`);

    // Placeholder for actual SMS sending
    // await twilioClient.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phoneNumber
    // });
  }

  /**
   * Format email content
   */
  private formatEmailContent(data: BookingNotification): string {
    const { booking } = data;
    return `
      <h2>Booking Confirmation</h2>
      <p>Dear ${booking.customerName},</p>
      <p>Your appointment has been confirmed.</p>
      <p><strong>Date & Time:</strong> ${booking.start}</p>
      ${booking.joinUrl ? `<p><strong>Teams Link:</strong> <a href="${booking.joinUrl}">Join Meeting</a></p>` : ''}
      ${booking.location ? `<p><strong>Location:</strong> ${booking.location}</p>` : ''}
      <p>Thank you for choosing KF Insurance.</p>
    `;
  }

  /**
   * Format SMS message
   */
  private formatSMSMessage(booking: any): string {
    return `KF Insurance: Your appointment on ${new Date(booking.start).toLocaleDateString()} at ${new Date(booking.start).toLocaleTimeString()} is confirmed. Check email for details.`;
  }
}

export default new NotificationService();