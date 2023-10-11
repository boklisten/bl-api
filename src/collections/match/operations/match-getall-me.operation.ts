import {
  BlapiResponse,
  CustomerItem,
  Item,
  Match,
  UserDetail,
} from "@boklisten/bl-model";

import { addDetailsToAllMatches } from "./match-getall-me-operation-helper";
import { getAllMatchesForUser } from "./match-operation-utils";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { itemSchema } from "../../item/item.schema";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { matchSchema } from "../match.schema";

export class GetMyMatchesOperation implements Operation {
  constructor(
    private userStorage?: BlDocumentStorage<User>,
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
    private matchStorage?: BlDocumentStorage<Match>,
    private customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private itemStorage?: BlDocumentStorage<Item>,
  ) {
    this.userStorage ??= new BlDocumentStorage(
      BlCollectionName.Users,
      UserSchema,
    );
    this.userDetailStorage ??= new BlDocumentStorage(
      BlCollectionName.UserDetails,
      userDetailSchema,
    );
    this.matchStorage ??= new BlDocumentStorage(
      BlCollectionName.Matches,
      matchSchema,
    );
    this.customerItemStorage ??= new BlDocumentStorage(
      BlCollectionName.CustomerItems,
      customerItemSchema,
    );
    this.itemStorage ??= new BlDocumentStorage(
      BlCollectionName.Items,
      itemSchema,
    );
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const matches = await getAllMatchesForUser(blApiRequest.user.details);

    if (matches.length === 0) {
      return new BlapiResponse(matches);
    }

    const matchesWithDetails = await addDetailsToAllMatches(
      matches,
      this.userDetailStorage,
      this.itemStorage,
      this.customerItemStorage,
    );

    return new BlapiResponse(matchesWithDetails);
  }
}
