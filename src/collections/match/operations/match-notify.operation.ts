import {
  BlapiResponse,
  BlError,
  Match,
  MatchVariant,
  UserDetail,
} from "@boklisten/bl-model";

import { massSendSMS } from "../../../messenger/sms/sms-service";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { matchSchema } from "../match.schema";

export class MatchNotifyOperation implements Operation {
  constructor(
    private matchStorage?: BlDocumentStorage<Match>,
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
  ) {
    this.matchStorage =
      matchStorage ??
      new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const message = blApiRequest.data?.["message"];
    if (!message || typeof message !== "string") {
      throw new BlError("Message must be set");
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const matches = await this.matchStorage.getAll();
    if (matches.length === 0) {
      throw new BlError("Could not find any matches!");
    }

    const matchedCustomerIds = Array.from(
      new Set(
        matches.flatMap((match) =>
          match._variant === MatchVariant.UserMatch
            ? [match.sender, match.receiver]
            : match.customer,
        ),
      ),
    );

    const customerPhoneNumbers =
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      (await this.userDetailStorage.getMany(matchedCustomerIds))
        .flatMap((customer) => [customer?.guardian?.phone, customer?.phone])
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .filter((phoneNumber) => phoneNumber?.length > 0);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const status = await massSendSMS(customerPhoneNumbers, message);
    return new BlapiResponse(status);
  }
}
