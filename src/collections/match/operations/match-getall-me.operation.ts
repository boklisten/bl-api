import {
  BlapiResponse,
  BlError,
  Match,
  MatchVariant,
  StandMatch,
  UserDetail,
  UserMatch,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { matchSchema } from "../match.schema";
import { BlCollectionName } from "../../bl-collection";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { SEDbQuery } from "../../../query/se.db-query";
import { ObjectId } from "mongodb";
import { User } from "../../user/user";
import { UserSchema } from "../../user/user.schema";

// TODO: Move these two to bl-model
interface RelevantDetails {
  name: string;
}
type MatchWithDetails =
  | StandMatch
  | (UserMatch & {
      senderDetails: RelevantDetails;
      receiverDetails: RelevantDetails;
    });

export class GetMyMatchesOperation implements Operation {
  constructor(
    private userStorage?: BlDocumentStorage<User>,
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
    private matchStorage?: BlDocumentStorage<Match>
  ) {
    this.userStorage = userStorage
      ? userStorage
      : new BlDocumentStorage(BlCollectionName.Users, UserSchema);
    this.userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this.matchStorage = matchStorage
      ? matchStorage
      : new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const meQuery = new SEDbQuery();
    meQuery.stringFilters = [
      {
        fieldName: "blid",
        value: blApiRequest.user.id,
      },
    ];
    const userId = new ObjectId(
      (await this.userDetailStorage.getByQuery(meQuery))[0].id
    );
    const query = new SEDbQuery();
    query.objectIdFilters = [
      // By putting each value in an array, the filters are OR'd instead of AND'd
      { fieldName: "customer", value: [userId] },
      { fieldName: "sender", value: [userId] },
      { fieldName: "receiver", value: [userId] },
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

    const userIds = Array.from(
      matches.reduce(
        (n, x) =>
          x._variant === MatchVariant.UserMatch
            ? new Set([...n, x.sender, x.receiver])
            : new Set([...n, x.customer]),
        new Set<string>()
      )
    );
    const detailsMap = new Map(
      await Promise.all(
        userIds.map((id) =>
          this.userDetailStorage
            .get(id)
            .then((detail): [string, UserDetail] => [id, detail])
        )
      )
    );
    const addDetails = (
      match: Match,
      detailsMap: Map<string, UserDetail>
    ): MatchWithDetails => {
      if (match._variant === MatchVariant.StandMatch) {
        return match;
      }
      const senderDetails = detailsMap.get(match.sender);
      const receiverDetails = detailsMap.get(match.receiver);
      const selectRelevantDetails = ({ name }: UserDetail) => ({
        name,
      });
      return {
        // Required to copy properly without Mongoose interfering
        ...JSON.parse(JSON.stringify(match)),
        senderDetails: selectRelevantDetails(senderDetails),
        receiverDetails: selectRelevantDetails(receiverDetails),
      };
    };
    const matchesWithUserNames = matches.map((match) =>
      addDetails(match, detailsMap)
    );

    return new BlapiResponse(matchesWithUserNames);
  }
}
