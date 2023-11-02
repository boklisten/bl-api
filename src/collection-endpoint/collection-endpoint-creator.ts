import { BlDocument } from "@boklisten/bl-model";
import { Router } from "express";

import { CollectionEndpoint } from "./collection-endpoint";
import { BlErrorLogCollection } from "../collections/bl-error-log/bl-error-log.collection";
import { BookingCollection } from "../collections/booking/booking.collection";
import { BranchCollection } from "../collections/branch/branch.collection";
import { BranchItemCollection } from "../collections/branch-item/branch-item.collection";
import { CompanyCollection } from "../collections/company/company.collection";
import { CustomerItemCollection } from "../collections/customer-item/customer-item.collection";
import { DeliveryCollection } from "../collections/delivery/delivery.collection";
import { EmailValidationCollection } from "../collections/email-validation/email-validation.collection";
import { InvoiceCollection } from "../collections/invoice/invoice.collection";
import { ItemCollection } from "../collections/item/item.collection";
import { MatchCollection } from "../collections/match/match.collection";
import { MessageCollection } from "../collections/message/message.collection";
import { OpeningHourCollection } from "../collections/opening-hour/opening-hour.collection";
import { OrderCollection } from "../collections/order/order.collection";
import { PaymentCollection } from "../collections/payment/payment.collection";
import { PendingPasswordResetCollection } from "../collections/pending-password-reset/pending-password-reset.collection";
import { UniqueItemCollection } from "../collections/unique-item/unique-item.collection";
import { UserDetailCollection } from "../collections/user-detail/user-detail.collection";
import { SEResponseHandler } from "../response/se.response.handler";

export class CollectionEndpointCreator {
  constructor(private _router: Router) {
    new SEResponseHandler();
  }

  create() {
    const collectionEndpoints: CollectionEndpoint<BlDocument>[] = [
      new CollectionEndpoint(this._router, new BranchCollection()),
      new CollectionEndpoint(this._router, new BranchItemCollection()),
      new CollectionEndpoint(this._router, new CustomerItemCollection()),
      new CollectionEndpoint(this._router, new DeliveryCollection()),
      new CollectionEndpoint(this._router, new ItemCollection()),
      new CollectionEndpoint(this._router, new OpeningHourCollection()),
      new CollectionEndpoint(this._router, new OrderCollection()),
      new CollectionEndpoint(this._router, new PaymentCollection()),
      new CollectionEndpoint(this._router, new UserDetailCollection()),
      new CollectionEndpoint(this._router, new BlErrorLogCollection()),
      new CollectionEndpoint(
        this._router,
        new PendingPasswordResetCollection(),
      ),
      new CollectionEndpoint(this._router, new EmailValidationCollection()),
      new CollectionEndpoint(this._router, new MessageCollection()),
      new CollectionEndpoint(this._router, new MatchCollection()),
      new CollectionEndpoint(this._router, new InvoiceCollection()),
      new CollectionEndpoint(this._router, new CompanyCollection()),
      new CollectionEndpoint(this._router, new BookingCollection()),
      new CollectionEndpoint(this._router, new UniqueItemCollection()),
    ];

    for (const collectionEndpoint of collectionEndpoints) {
      collectionEndpoint.create();
      collectionEndpoint.printEndpoints();
    }
  }
}
