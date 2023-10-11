import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentConsumerBillingAddress } from "./dibs-easy-payment-consumer-billing-address";
import { DibsEasyPaymentConsumerCompany } from "./dibs-easy-payment-consumer-company";
import { DibsEasyPaymentConsumerPrivatePerson } from "./dibs-easy-payment-consumer-private-person";
import { DibsEasyPaymentConsumerShippingAddress } from "./dibs-easy-payment-consumer-shipping-address";

@JsonObject
export class DibsEasyPaymentConsumer {
  @JsonMember({ type: DibsEasyPaymentConsumerBillingAddress })
  billingAddress?: DibsEasyPaymentConsumerBillingAddress;
  @JsonMember({ type: DibsEasyPaymentConsumerShippingAddress })
  shippingAddress?: DibsEasyPaymentConsumerShippingAddress;
  @JsonMember({ type: DibsEasyPaymentConsumerCompany })
  company?: DibsEasyPaymentConsumerCompany;
  @JsonMember({ type: DibsEasyPaymentConsumerPrivatePerson })
  privatePerson?: DibsEasyPaymentConsumerPrivatePerson;
}
