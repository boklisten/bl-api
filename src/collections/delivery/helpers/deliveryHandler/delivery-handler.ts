import {
  Delivery,
  Order,
  BlError,
  AccessToken,
  Item,
  DeliveryInfoBring,
  Branch,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../storage/blDocumentStorage";
import { orderSchema } from "../../../order/order.schema";
import { itemSchema } from "../../../item/item.schema";
import { BringDeliveryService } from "../deliveryBring/bringDelivery.service";
import { deliverySchema } from "../../delivery.schema";
import { branchSchema } from "../../../branch/branch.schema";

export class DeliveryHandler {
  private orderStorage: BlDocumentStorage<Order>;
  private itemStorage: BlDocumentStorage<Item>;
  private bringDeliveryService: BringDeliveryService;
  private deliveryStorage?: BlDocumentStorage<Delivery>;
  private branchStorage?: BlDocumentStorage<Branch>;

  constructor(
    orderStorage?: BlDocumentStorage<Order>,
    branchStorage?: BlDocumentStorage<Branch>,
    itemStorage?: BlDocumentStorage<Item>,
    deliveryStorage?: BlDocumentStorage<Delivery>,
    bringDeliveryService?: BringDeliveryService
  ) {
    this.orderStorage =
      orderStorage ?? new BlDocumentStorage("orders", orderSchema);
    this.itemStorage =
      itemStorage ?? new BlDocumentStorage("items", itemSchema);
    this.bringDeliveryService =
      bringDeliveryService ?? new BringDeliveryService();
    this.deliveryStorage =
      deliveryStorage ?? new BlDocumentStorage("deliveries", deliverySchema);
    this.branchStorage =
      branchStorage ?? new BlDocumentStorage("branches", branchSchema);
  }

  public updateOrderBasedOnMethod(
    delivery: Delivery,
    order: Order,
    accessToken?: AccessToken
  ): Promise<Delivery> {
    switch (delivery.method) {
      case "branch":
        return this.updateOrderWithDeliveryMethodBranch(
          delivery,
          order,
          accessToken
        );
      case "bring":
        return this.updateOrderWithDeliveryMethodBring(
          delivery,
          order,
          accessToken
        );
    }
  }

  private updateOrderWithDeliveryMethodBranch(
    delivery: Delivery,
    order: Order,
    accessToken: AccessToken
  ): Promise<Delivery> {
    return this.updateOrder(order, delivery, accessToken)
      .then(() => {
        return delivery;
      })
      .catch((blError: BlError) => {
        return Promise.reject(blError);
      });
  }

  private updateOrderWithDeliveryMethodBring(
    delivery: Delivery,
    order: Order,
    accessToken: AccessToken
  ): Promise<Delivery> {
    return new Promise((resolve, reject) => {
      this.fetchItems(order).then((items: Item[]) => {
        this.getBringDeliveryInfoAndUpdateDelivery(
          order,
          delivery,
          items,
          accessToken
        )
          .then((updatedDelivery: Delivery) => {
            this.updateOrder(order, updatedDelivery, accessToken)
              .then(() => {
                resolve(updatedDelivery);
              })
              .catch((blError: BlError) => {
                return reject(blError);
              });
          })
          .catch((bringDeliveryInfoError) => {
            reject(
              new BlError("failed to get bring delivery info").add(
                bringDeliveryInfoError
              )
            );
          });
      });
    });
  }

  private updateOrder(
    order: Order,
    delivery: Delivery,
    accessToken: AccessToken
  ): Promise<boolean> {
    let orderUpdateData = { delivery: delivery.id };

    return this.orderStorage
      .update(order.id, orderUpdateData, {
        id: accessToken.sub,
        permission: accessToken.permission,
      })
      .then(() => {
        return true;
      })
      .catch((blError: BlError) => {
        return Promise.reject(
          new BlError("could not update order").add(blError)
        );
      });
  }

  private fetchItems(order: Order): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      const itemIds: string[] = order.orderItems.map(
        (orderItem) => orderItem.item as string
      );

      this.itemStorage
        .getMany(itemIds)
        .then((items: Item[]) => {
          resolve(items);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }

  private getBringDeliveryInfoAndUpdateDelivery(
    order: Order,
    delivery: Delivery,
    items: Item[],
    accessToken: AccessToken
  ): Promise<Delivery> {
    return new Promise((resolve, reject) => {
      this.branchStorage
        .get(order.branch as string)
        .then((branch: Branch) => {
          const freeDelivery =
            (branch.paymentInfo && branch.paymentInfo.responsibleForDelivery) ||
            order.handoutByDelivery;

          this.bringDeliveryService
            .getDeliveryInfoBring(
              delivery.info["facilityAddress"],
              delivery.info["shipmentAddress"],
              items,
              freeDelivery
            )
            .then((deliveryInfoBring: DeliveryInfoBring) => {
              if (delivery.info["trackingNumber"]) {
                deliveryInfoBring["trackingNumber"] =
                  delivery.info["trackingNumber"];
              }

              this.deliveryStorage
                .update(
                  delivery.id,
                  { amount: deliveryInfoBring.amount, info: deliveryInfoBring },
                  { id: accessToken.sub, permission: accessToken.permission }
                )
                .then((updatedDelivery: Delivery) => {
                  resolve(updatedDelivery);
                })
                .catch((updateDeliveryError: BlError) => {
                  reject(updateDeliveryError);
                });
            })
            .catch((blError) => {
              reject(blError);
            });
        })
        .catch((getBranchError: BlError) => {
          reject(getBranchError);
        });
    });
  }
}
