import { BlapiResponse, BlError, CustomerItem, Match, Order } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { matchSchema } from "../match.schema";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { BlCollectionName } from "../../bl-collection";
import { MatchFinder } from "../helpers/match-finder-2/match-finder";
import { candidateMatchToMatch, getReceivers, getSenders, verifyMatcherSpec } from "./match-hook-utils";
import { orderSchema } from "../../order/order.schema";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";

export class MatchGenerateHook implements Operation {
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
      : new BlDocumentStorage(
          BlCollectionName.Matches,
          matchSchema,
        );
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const matcherSpec = blApiRequest.data;
    if (!verifyMatcherSpec(matcherSpec)) {
      throw new BlError(
        // `Malformed MatcherSpec ${JSON.stringify(matcherSpec)}`
          `Malformed MatcherSpec ${matcherSpec}`
      ).code(907); // TODO: wrong code
    }
    const [senders, receivers] = await Promise.all([
      getSenders(matcherSpec.senderBranches, this.customerItemStorage),
      getReceivers(matcherSpec.receiverBranches, this.orderStorage),
    ]);
    if (senders.length === 0 && receivers.length === 0) {
      throw new BlError("No senders or receivers")
    }
    const matches = new MatchFinder(senders, receivers)
        .generateMatches()
        .map((candidate) => candidateMatchToMatch(candidate))
    if (matches.length === 0) {
      throw new BlError("No matches generated")
    }

    const res = await this.matchStorage.addMany(matches);
    return new BlapiResponse(res.map(r => r.id));
  }
}
