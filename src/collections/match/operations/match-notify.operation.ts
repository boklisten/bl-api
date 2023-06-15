import {
  BlapiResponse,
  BlError,
  Match,
  MatchVariant,
  UserDetail,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { matchSchema } from "../match.schema";
import { BlCollectionName } from "../../bl-collection";
import { Operation } from "../../../operation/operation";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { massSendSMS } from "../../../messenger/sms/sms-service";
import { BlApiRequest } from "../../../request/bl-api-request";

export class MatchNotifyOperation implements Operation {
  constructor(
    private matchStorage?: BlDocumentStorage<Match>,
    private userDetailStorage?: BlDocumentStorage<UserDetail>
  ) {
    this.matchStorage =
      matchStorage ??
      new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const message = blApiRequest.data.message;
    if (!message || typeof message !== "string") {
      throw new BlError("Message must be set");
    }

    const matches = await this.matchStorage.getAll();
    if (matches.length === 0) {
      throw new BlError("Could not find any matches!");
    }

    const matchedCustomerIds = Array.from(
      new Set(
        matches.flatMap((match) =>
          match._variant === MatchVariant.UserMatch
            ? [match.sender, match.receiver]
            : match.customer
        )
      )
    );

    const customerPhoneNumbers = (
      await this.userDetailStorage.getMany(matchedCustomerIds)
    )
      .flatMap((customer) => [customer.guardian?.phone, customer.phone])
      .filter((phoneNumber) => phoneNumber.length > 0);

    const status = await massSendSMS(customerPhoneNumbers, message);
    return new BlapiResponse(status);
  }
}
