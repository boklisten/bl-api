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
import twilio from "twilio";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async match(order: Order, userDetail: UserDetail): Promise<any> {
    // this.validateBranch(order.branch as string);
    // this.validatePayment(order.payments);
    await this.validateDelivery(order);
    // this.validateCreationTime(order);

    const matchProfile: MatchProfile =
      this.matchHelper.convertUserDetailToMatchProfile(userDetail);
    const matchItems: MatchItem[] =
      this.matchHelper.convertOrderItemsToMatchItems(order.orderItems);

    // eslint-disable-next-line no-useless-catch
    try {
      const match = await this.matchFinder.find(matchItems);
      const updatedMatch = await this.matchUpdater.update(
        match,
        matchProfile,
        matchItems
      );
      // Temporary logic to send match sms
      const accountSid = process.env.TWILIO_SMS_SID;
      const authToken = process.env.TWILIO_SMS_AUTH_TOKEN;
      const client = twilio(accountSid, authToken);
      const sendSms = (phone: string, message: string) => {
        client.messages
          .create({
            body: message,
            messagingServiceSid: "MG2036d95f2f1f3524ff86dbd7cbfd3bb3",
            to: "+47" + phone,
          })
          .then((message) => console.log(message.sid));
      };
      sendSms(
        match.sender.phone as string,
        `Hei! Vi har matchet det med en mottaker. Gå inn på https://staging.boklisten.no/match/${match.id}/d for å levere fra deg bøkene dine.`
      );
      sendSms(
        match.recievers[0].phone,
        `Hei! Du kan nå hente bøkene dine. Gå inn på https://staging.boklisten.no/match/${match.id}/r?r=${match.recievers[0].userId} for å finne ut hvordan.`
      );
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
