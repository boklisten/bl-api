import { DibsEasyPaymentConsumerBillingAddress } from "./dibs-easy-payment-consumer-billing-address";
import { DibsEasyPaymentConsumerCompany } from "./dibs-easy-payment-consumer-company";
import { DibsEasyPaymentConsumerPrivatePerson } from "./dibs-easy-payment-consumer-private-person";
import { DibsEasyPaymentConsumerShippingAddress } from "./dibs-easy-payment-consumer-shipping-address";

export class DibsEasyPaymentConsumer {
  billingAddress?: DibsEasyPaymentConsumerBillingAddress;
  shippingAddress?: DibsEasyPaymentConsumerShippingAddress;
  company?: DibsEasyPaymentConsumerCompany;
  privatePerson?: DibsEasyPaymentConsumerPrivatePerson;
}
