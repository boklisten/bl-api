
/**
 * Handles payment.refund events from dibs easy api
 */
export class DibsWebhookPaymentRefundHander {

  public handleEvent(event): Promise<boolean> {
    resolve(true);
  }

  private initiated() {
    // when a refund is initiated

  }

  private failed() {
    // when a refund has not gone trough

  }

  private completed() {
    // when a refund successfully has been completed
  }
}
