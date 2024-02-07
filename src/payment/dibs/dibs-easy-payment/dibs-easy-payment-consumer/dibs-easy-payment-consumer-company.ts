import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentConsumerPhone } from "./dibs-easy-payment-consumer-phone";

@JsonObject
export class DibsEasyPaymentConsumerCompany {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  name: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  organisationNumber: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  email: string;
  @JsonMember({ type: DibsEasyPaymentConsumerPhone })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  phoneNumber: DibsEasyPaymentConsumerPhone;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  merchantReference: string;
}
