import { DibsEasyPaymentConsumerBillingAddress } from "./dibs-easy-payment-consumer-billing-address";
import { DibsEasyPaymentConsumerShippingAddress } from "./dibs-easy-payment-consumer-shipping-address";
import { DibsEasyPaymentConsumerCompany } from "./dibs-easy-payment-consumer-company";
import { DibsEasyPaymentConsumerPrivatePerson } from "./dibs-easy-payment-consumer-private-person";
import { JsonMember, JsonObject } from "typedjson-npm";

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
