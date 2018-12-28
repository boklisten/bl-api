
/**
 * Handles payment.charged events from Dibs easy api 
 */
export class DibsWebhookPaymentChargeHandler {

  public handleEvent(event): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      resolve(true);
    })
  }

  /**
   * When the dibs-payment is successfully charged 
   */
  private created() {
    // find payment with the specified id
    // should check if amount is equal to the expected amount
    
    // should check reference and other security checks for validity
    
    // should update the payment with event
    
    // should update payment with confirmed true
    
    // should place order if it is not confirmed yet
  }

  private failed() {
    // should update payment with event
    // should set confirmed to false 
  }
 
}
