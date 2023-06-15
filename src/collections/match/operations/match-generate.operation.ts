import {
  BlapiResponse,
  BlError,
  CustomerItem,
  Match,
  Order,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { matchSchema } from "../match.schema";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { BlCollectionName } from "../../bl-collection";
import { MatchFinder } from "../helpers/match-finder-2/match-finder";
import {
  candidateMatchToMatch,
  getMatchableReceivers,
  getMatchableSenders,
  verifyMatcherSpec,
} from "./match-generate-operation-helper";
import { orderSchema } from "../../order/order.schema";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import assignMeetingInfoToMatches from "../helpers/match-finder-2/match-meeting-info";

export class MatchGenerateOperation implements Operation {
  constructor(
    private customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private matchStorage?: BlDocumentStorage<Match>,
    private orderStorage?: BlDocumentStorage<Order>
  ) {
    this.customerItemStorage = customerItemStorage
      ? customerItemStorage
      : new BlDocumentStorage(
          BlCollectionName.CustomerItems,
          customerItemSchema
        );
    this.matchStorage = matchStorage
      ? matchStorage
      : new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const matcherSpec = blApiRequest.data;
    if (!verifyMatcherSpec(matcherSpec)) {
      throw new BlError(`Malformed MatcherSpec ${matcherSpec}`).code(701);
    }
    const [senders, receivers] = await Promise.all([
      getMatchableSenders(matcherSpec.senderBranches, this.customerItemStorage),
      getMatchableReceivers(matcherSpec.receiverBranches, this.orderStorage),
    ]);
    if (senders.length === 0 && receivers.length === 0) {
      throw new BlError("No senders or receivers");
    }
    const matches = assignMeetingInfoToMatches(
      new MatchFinder(senders, receivers).generateMatches(),
      matcherSpec.standLocation,
      matcherSpec.userMatchLocations,
      new Date(matcherSpec.startTime)
    ).map((candidate) => candidateMatchToMatch(candidate));
    if (matches.length === 0) {
      throw new BlError("No matches generated");
    }

    const res = await this.matchStorage.addMany(matches);
    return new BlapiResponse(res.map((r) => r.id));
  }
}
