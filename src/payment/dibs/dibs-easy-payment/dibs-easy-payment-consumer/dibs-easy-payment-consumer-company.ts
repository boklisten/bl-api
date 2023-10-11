import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentConsumerPhone } from "./dibs-easy-payment-consumer-phone";

@JsonObject
export class DibsEasyPaymentConsumerCompany {
  @JsonMember({ type: String })
  name: string;
  @JsonMember({ type: String })
  organisationNumber: string;
  @JsonMember({ type: String })
  email: string;
  @JsonMember({ type: DibsEasyPaymentConsumerPhone })
  phoneNumber: DibsEasyPaymentConsumerPhone;
  @JsonMember({ type: String })
  merchantReference: string;
}
