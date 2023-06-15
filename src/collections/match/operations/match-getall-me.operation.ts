import {
  BlapiResponse,
  BlError,
  CustomerItem,
  Item,
  Match,
  UserDetail,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { matchSchema } from "../match.schema";
import { BlCollectionName } from "../../bl-collection";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { SEDbQuery } from "../../../query/se.db-query";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";
import { customerItemSchema } from "../../customer-item/customer-item.schema";
import { itemSchema } from "../../item/item.schema";
import { addDetailsToAllMatches } from "./match-getall-me-operation-helper";

export class GetMyMatchesOperation implements Operation {
  constructor(
    private userStorage?: BlDocumentStorage<User>,
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
    private matchStorage?: BlDocumentStorage<Match>,
    private customerItemStorage?: BlDocumentStorage<CustomerItem>,
    private itemStorage?: BlDocumentStorage<Item>
  ) {
    this.userStorage ??= new BlDocumentStorage(
      BlCollectionName.Users,
      UserSchema
    );
    this.userDetailStorage ??= new BlDocumentStorage(
      BlCollectionName.UserDetails,
      userDetailSchema
    );
    this.matchStorage ??= new BlDocumentStorage(
      BlCollectionName.Matches,
      matchSchema
    );
    this.customerItemStorage ??= new BlDocumentStorage(
      BlCollectionName.CustomerItems,
      customerItemSchema
    );
    this.itemStorage ??= new BlDocumentStorage(
      BlCollectionName.Items,
      itemSchema
    );
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const query = new SEDbQuery();
    query.objectIdFilters = [
      // By putting each value in an array, the filters are OR'd instead of AND'd
      { fieldName: "customer", value: [blApiRequest.user.details] },
      { fieldName: "sender", value: [blApiRequest.user.details] },
      { fieldName: "receiver", value: [blApiRequest.user.details] },
    ];

    let matches: Match[];
    try {
      matches = await this.matchStorage.getByQuery(query);
    } catch (e) {
      if (e instanceof BlError) {
        if (e.getCode() === 702) {
          return new BlapiResponse([]);
        }
      }
      throw e;
    }

    const matchesWithDetails = await addDetailsToAllMatches(
      matches,
      this.userDetailStorage,
      this.itemStorage,
      this.customerItemStorage
    );

    return new BlapiResponse(matchesWithDetails);
  }
}
