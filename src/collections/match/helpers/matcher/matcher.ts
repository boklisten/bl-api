import {
  Order,
  UserDetail,
  BlError,
  Delivery,
  MatchProfile,
  MatchItem,
  Match,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { deliverySchema } from "../../../delivery/delivery.schema";
import { dateService } from "../../../../blc/date.service";
import { MatchHelper } from "../match-helper";
import { MatchFinder } from "../match-finder/match-finder";
import { MatchUpdater } from "../match-updater/match-updater";
import twilio from "twilio";
import { userDetailSchema } from "../../../user-detail/user-detail.schema";
import { orderSchema } from "../../../order/order.schema";
import moment, { Moment } from "moment";
import { matchSchema } from "../../match.schema";
import { BlCollectionName } from "../../../bl-collection";

// branch id in PROD : 5b6442ebd2e733002fae8a31
// branch id in DEV :
// branch id in LOCAL : 5db00e6bcbfeed32123184c3
export class Matcher {
  private matchingWindow: { fromHour: number; toHour: number };
  private matchHelper: MatchHelper;

  constructor(
    private deliveryStorage?: BlDocumentStorage<Delivery>,
    private matchFinder?: MatchFinder,
    private matchUpdater?: MatchUpdater,
    private userDetailStorage?: BlDocumentStorage<UserDetail>,
    private orderStorage?: BlDocumentStorage<Order>,
    private matchStorage?: BlDocumentStorage<Match>
  ) {
    this.matchStorage = matchStorage
      ? matchStorage
      : new BlDocumentStorage(BlCollectionName.Matches, matchSchema);
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this.orderStorage = orderStorage
      ? orderStorage
      : new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this.deliveryStorage = this.deliveryStorage
      ? this.deliveryStorage
      : new BlDocumentStorage<Delivery>(
          BlCollectionName.Deliveries,
          deliverySchema
        );

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

  public async matchOrders(orderIDs: string[]) {
    let meetingTimeOffset = 0;
    for (const orderID of orderIDs) {
      const meetingTime = moment("2022-08-26T11:30:00+00:00").add(
        meetingTimeOffset,
        "minutes"
      );
      const order = await this.orderStorage.get(orderID);
      const customerDetails = await this.userDetailStorage.get(
        order.customer as string
      );
      await this.match(order, customerDetails, meetingTime);
      meetingTimeOffset += 1;
    }
  }

  // Create matches with a single person
  private async createFakeMatch(matchItems: MatchItem[]) {
    const match = {
      // Update these to Arnes details
      sender: {
        userId: "5c366ffb6539d7001ad2bed6",
        name: "Arne Søraas",
        email: "arne@boklisten.no",
        phone: "90652904",
        meetingOptions: null,
      },
      recievers: [],
      items: matchItems,
      state: "created",
      events: [{ type: "created", time: new Date() }],
      meetingPoint: null,
      branch: "62ed2447a26632004868e118",
    } as Match;
    await this.matchStorage.add(match, {
      id: "62ed2447a26632004868e118",
      permission: "super",
    });
  }

  // 1 check if order is on correct branch
  // 2 check if payment is of type later
  // 3 check if time is inside period
  // 4 matchFinder check for match
  // 5 add meetingpoint to be the next opening day, if none is found reject
  // 5 update orderItems with match id
  // 6 notify sender and reciever
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async match(
    order: Order,
    userDetail: UserDetail,
    matchTime: Moment
  ): Promise<unknown> {
    // this.validateBranch(order.branch as string);
    // this.validatePayment(order.payments);
    await this.validateDelivery(order);
    // this.validateCreationTime(order);

    const matchProfile: MatchProfile =
      this.matchHelper.convertUserDetailToMatchProfile(userDetail);
    const matchItems: MatchItem[] =
      await this.matchHelper.convertOrderItemsToMatchItems(order.orderItems);

    await this.createFakeMatch(matchItems);

    // eslint-disable-next-line no-useless-catch
    try {
      const match = await this.matchFinder.find(matchItems);
      await this.matchUpdater.update(
        match,
        matchProfile,
        matchItems,
        matchTime
      );
      // Temporary logic to send match sms
      const accountSid = process.env.TWILIO_SMS_SID;
      const authToken = process.env.TWILIO_SMS_AUTH_TOKEN;
      const client = twilio(accountSid, authToken);
      const sendSms = async (phone: string, message: string) => {
        await client.messages.create({
          body: message,
          messagingServiceSid: "MG2036d95f2f1f3524ff86dbd7cbfd3bb3",
          to: "+47" + phone,
        });
      };
      try {
        await sendSms(
          match.recievers[0].phone,
          `Hei! I morgen skal du hente bøkene dine fra Boklisten. Gå inn på lenken i neste melding for å finne ut når og hvordan. Mvh. Boklisten.no`
        );
        await sendSms(
          match.recievers[0].phone,
          `https://next.boklisten.no/match/r/${match.id}`
        );
      } catch (error) {
        console.error("Failed to send sms to match with ID " + match.id);
      }
    } catch (e) {
      throw e;
    }

    return true;
  }

  private async validateDelivery(order: Order): Promise<boolean> {
    if (!order.delivery) {
      return true;
    }
    // eslint-disable-next-line no-useless-catch
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
