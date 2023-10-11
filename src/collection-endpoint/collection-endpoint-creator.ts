import {
  BlDocument,
  Branch,
  BranchItem,
  CustomerItem,
  Delivery,
  Item,
  OpeningHour,
  Order,
  Payment,
  UserDetail,
  Message,
  Invoice,
  Company,
  Match,
  Booking,
  UniqueItem,
} from "@boklisten/bl-model";
import { Router } from "express";

import { CollectionEndpoint } from "./collection-endpoint";
import { BlErrorLog } from "../collections/bl-error-log/bl-error-log";
import { BlErrorLogCollection } from "../collections/bl-error-log/bl-error-log.collection";
import { BookingCollection } from "../collections/booking/booking.collection";
import { BranchCollection } from "../collections/branch/branch.collection";
import { BranchItemCollection } from "../collections/branch-item/branch-item.collection";
import { CompanyCollection } from "../collections/company/company.collection";
import { CustomerItemCollection } from "../collections/customer-item/customer-item.collection";
import { DeliveryCollection } from "../collections/delivery/delivery.collection";
import { EmailValidation } from "../collections/email-validation/email-validation";
import { EmailValidationCollection } from "../collections/email-validation/email-validation.collection";
import { InvoiceCollection } from "../collections/invoice/invoice.collection";
import { ItemCollection } from "../collections/item/item.collection";
import { MatchCollection } from "../collections/match/match.collection";
import { MessageCollection } from "../collections/message/message.collection";
import { OpeningHourCollection } from "../collections/opening-hour/opening-hour.collection";
import { OrderCollection } from "../collections/order/order.collection";
import { PasswordReset } from "../collections/password-reset/password-reset";
import { PasswordResetCollection } from "../collections/password-reset/password-reset.collection";
import { PaymentCollection } from "../collections/payment/payment.collection";
import { UniqueItemCollection } from "../collections/unique-item/unique-item.collection";
import { UserDetailCollection } from "../collections/user-detail/user-detail.collection";
import { SEResponseHandler } from "../response/se.response.handler";

export class CollectionEndpointCreator {
  constructor(private _router: Router) {
    new SEResponseHandler();
  }

  create() {
    const collectionEndpoints: CollectionEndpoint<BlDocument>[] = [
      new CollectionEndpoint<Branch>(this._router, new BranchCollection()),
      new CollectionEndpoint<BranchItem>(
        this._router,
        new BranchItemCollection(),
      ),
      new CollectionEndpoint<CustomerItem>(
        this._router,
        new CustomerItemCollection(),
      ),
      new CollectionEndpoint<Delivery>(this._router, new DeliveryCollection()),
      new CollectionEndpoint<Item>(this._router, new ItemCollection()),
      new CollectionEndpoint<OpeningHour>(
        this._router,
        new OpeningHourCollection(),
      ),
      new CollectionEndpoint<Order>(this._router, new OrderCollection()),
      new CollectionEndpoint<Payment>(this._router, new PaymentCollection()),
      new CollectionEndpoint<UserDetail>(
        this._router,
        new UserDetailCollection(),
      ),
      new CollectionEndpoint<BlErrorLog>(
        this._router,
        new BlErrorLogCollection(),
      ),
      new CollectionEndpoint<PasswordReset>(
        this._router,
        new PasswordResetCollection(),
      ),
      new CollectionEndpoint<EmailValidation>(
        this._router,
        new EmailValidationCollection(),
      ),
      new CollectionEndpoint<Message>(this._router, new MessageCollection()),
      new CollectionEndpoint<Match>(this._router, new MatchCollection()),
      new CollectionEndpoint<Invoice>(this._router, new InvoiceCollection()),
      new CollectionEndpoint<Company>(this._router, new CompanyCollection()),
      new CollectionEndpoint<Booking>(this._router, new BookingCollection()),
      new CollectionEndpoint<UniqueItem>(
        this._router,
        new UniqueItemCollection(),
      ),
    ];

    for (const collectionEndpoint of collectionEndpoints) {
      collectionEndpoint.create();
      collectionEndpoint.printEndpoints();
    }
  }
}
