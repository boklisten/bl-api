import {
  Order,
  UserDetail,
  BlError,
  Delivery,
  MatchProfile,
  MatchItem,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { deliverySchema } from "../../../delivery/delivery.schema";
import { dateService } from "../../../../blc/date.service";
import { MatchHelper } from "../match-helper";
import { MatchFinder } from "../match-finder/match-finder";
import { MatchUpdater } from "../match-updater/match-updater";

// branch id in PROD : 5b6442ebd2e733002fae8a31
// branch id in DEV :
// branch id in LOCAL : 5db00e6bcbfeed32123184c3
export class Matcher {
  private matchingWindow: { fromHour: number; toHour: number };
  private matchHelper: MatchHelper;

  constructor(
    private deliveryStorage?: BlDocumentStorage<Delivery>,
    private matchFinder?: MatchFinder,
    private matchUpdater?: MatchUpdater
  ) {
    this.deliveryStorage = this.deliveryStorage
      ? this.deliveryStorage
      : new BlDocumentStorage<Delivery>("deliveries", deliverySchema);

    this.matchUpdater = this.matchUpdater
      ? this.matchUpdater
      : new MatchUpdater();
    this.matchFinder = this.matchFinder ? this.matchFinder : new MatchFinder();

    this.matchingWindow = {
      fromHour: 8,
      toHour: 20,
    };

    this.matchHelper = new MatchHelper();
  }

  // 1 check if order is on correct branch
  // 2 check if payment is of type later
  // 3 check if time is inside period
  // 4 matchFinder check for match
  // 5 add meetingpoint to be the next opening day, if none is found reject
  // 5 update orderItems with match id
  // 6 notify sender and reciever
  public async match(order: Order, userDetail: UserDetail): Promise<any> {
    this.validateBranch(order.branch as string);
    this.validatePayment(order.payments);
    await this.validateDelivery(order);
    this.validateCreationTime(order);

    const matchProfile: MatchProfile =
      this.matchHelper.convertUserDetailToMatchProfile(userDetail);
    const matchItems: MatchItem[] =
      this.matchHelper.convertOrderItemsToMatchItems(order.orderItems);

    try {
      const match = await this.matchFinder.find(matchItems);
      await this.matchUpdater.update(match, matchProfile, matchItems);
    } catch (e) {
      throw e;
    }

    return true;
  }

  private async validateDelivery(order: Order): Promise<boolean> {
    if (!order.delivery) {
      return true;
    }
    try {
      const delivery: Delivery = await this.deliveryStorage.get(
        order.delivery as string
      );
      if (delivery.method !== "branch") {
        throw new BlError('delivery does not have method "branch"');
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  private validatePayment(payments: any[]) {
    if (!payments || payments.length <= 0) {
      throw new BlError("payment is not present on order");
    }
  }

  private validateBranch(branchId) {
    const validBranches = [
      "5b6442ebd2e733002fae8a31",
      "5db00e6bcbfeed32123184c3",
    ];

    if (validBranches.indexOf(branchId.toString()) > -1) {
      return true;
    } else {
      throw new BlError(
        `trying to match with order.branch "${branchId}" not in matching-branches`
      );
    }
  }

  private validateCreationTime(order: Order) {
    if (
      !dateService.betweenHours(
        order.creationTime,
        this.matchingWindow.fromHour,
        this.matchingWindow.toHour,
        "Europe/Oslo"
      )
    ) {
      throw new BlError(
        "order.creationTime is not in time for the matching-window"
      );
    }
  }
}
