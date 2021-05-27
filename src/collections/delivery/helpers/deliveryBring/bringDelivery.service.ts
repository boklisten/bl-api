import { BlError, DeliveryInfoBring, Item } from "@boklisten/bl-model";
import { HttpHandler } from "../../../../http/http.handler";
import { BringDelivery } from "./bringDelivery";
import moment = require("moment");
import { APP_CONFIG } from "../../../../application-config";
import { isNullOrUndefined } from "util";

export type ShipmentAddress = {
  name: string;
  postalCode: string;
  postalCity: string;
  address: string;
};

export type FacilityAddress = {
  address: string;
  postalCode: string;
  postalCity: string;
};

export class BringDeliveryService {
  private httpHandler: HttpHandler;
  private bringShipmentUrl: string;
  private clientUrl: string;

  constructor(httpHandler?: HttpHandler) {
    this.httpHandler = httpHandler ? httpHandler : new HttpHandler();
    this.bringShipmentUrl = APP_CONFIG.url.bring.shipmentInfo;
    this.clientUrl = APP_CONFIG.url.blWeb.base;
  }

  public getDeliveryInfoBring(
    facilityAddress: FacilityAddress,
    shipmentAddress: ShipmentAddress,
    items: Item[]
  ): Promise<DeliveryInfoBring> {
    if (
      isNullOrUndefined(facilityAddress) ||
      isNullOrUndefined(shipmentAddress)
    ) {
      return Promise.reject(
        new BlError(
          "required fields facilityAddress or shipmentAddress are null or undefined"
        )
      );
    }
    if (!items || items.length <= 0) {
      return Promise.reject(new BlError("items is empty or undefined"));
    }

    if (!facilityAddress.postalCode || facilityAddress.postalCode.length <= 0) {
      return Promise.reject(
        new BlError("fromPostalCode is empty or undefined")
      );
    }

    if (!shipmentAddress.postalCode || shipmentAddress.postalCode.length <= 0) {
      return Promise.reject(new BlError("toPostalCode is empty or undefined"));
    }

    return new Promise((resolve, reject) => {
      const bringDelivery = this.createBringDelivery(
        facilityAddress,
        shipmentAddress,
        items
      );
      const queryString = this.httpHandler.createQueryString(bringDelivery);
      const bringAuthHeaders = {
        "X-MyBring-API-Key": process.env.BRING_API_KEY,
        "X-MyBring-API-Uid": process.env.BRING_API_ID,
      };

      this.httpHandler
        .getWithQuery(this.bringShipmentUrl, queryString, bringAuthHeaders)
        .then((responseData: any) => {
          let deliveryInfoBring: DeliveryInfoBring;
          try {
            deliveryInfoBring = this.getDeliveryInfoBringFromBringResponse(
              facilityAddress,
              shipmentAddress,
              responseData
            );
          } catch (e) {
            if (e instanceof BlError) {
              return reject(e);
            }

            return reject(
              new BlError(
                "unkown error, could not parse the data from bring api"
              ).store("error", e)
            );
          }

          resolve(deliveryInfoBring);
        })
        .catch((blError: BlError) => {
          return reject(blError);
        });
    });
  }

  private createBringDelivery(
    facilityAddress: FacilityAddress,
    shipmentAddress: ShipmentAddress,
    items: Item[]
  ): BringDelivery {
    let bringDelivery: BringDelivery;

    let totalWeight = 0;

    for (const item of items) {
      if (item.info && item.info["weight"]) {
        totalWeight += parseInt(item.info["weight"]);
      } else {
        totalWeight += 500;
      }
    }

    if (totalWeight === 0) {
      totalWeight = 500;
    }

    bringDelivery = {
      clientUrl: this.clientUrl,
      weight: totalWeight,
      frompostalcode: facilityAddress.postalCode,
      topostalcode: shipmentAddress.postalCode,
      fromcountry: "NO",
      tocountry: "NO",
      product: "SERVICEPAKKE",
    };

    return bringDelivery;
  }

  private getDeliveryInfoBringFromBringResponse(
    facilityAddress: FacilityAddress,
    shipmentAddress: ShipmentAddress,
    responseData: any
  ): DeliveryInfoBring {
    let deliveryInfoBring: DeliveryInfoBring = {
      amount: -1,
      estimatedDelivery: new Date(),
      taxAmount: 0,
      facilityAddress: facilityAddress,
      shipmentAddress: shipmentAddress,
      from: facilityAddress.postalCode,
      to: shipmentAddress.postalCode,
    };

    if (
      !responseData["consignments"] ||
      !Array.isArray(
        responseData["consignments"] ||
          responseData["consignments"].length === 0
      )
    ) {
      throw new BlError("no consignments provided in response from bringApi");
    }

    if (
      !responseData["consignments"][0]["products"] ||
      !Array.isArray(
        responseData["consignments"][0]["products"] ||
          responseData["consignments"][0]["products"].length === 0
      )
    ) {
      throw new BlError("no products provided in response from bringApi");
    }

    deliveryInfoBring = this.getBringProduct(
      deliveryInfoBring,
      responseData["consignments"][0]["products"][
        responseData["consignments"][0]["products"].length - 1
      ]
    );

    if (deliveryInfoBring.amount === -1) {
      throw new BlError("could not parse the data from the bring api").store(
        "responseData",
        responseData
      );
    }

    return deliveryInfoBring;
  }

  private getBringProduct(
    deliveryInfoBring: DeliveryInfoBring,
    product
  ): DeliveryInfoBring {
    const priceInfo = product["price"]["listPrice"];
    const priceWithoutAdditionalService =
      priceInfo["priceWithoutAdditionalServices"];
    if (priceWithoutAdditionalService) {
      deliveryInfoBring.amount = parseInt(
        priceWithoutAdditionalService["amountWithVAT"]
      );
      deliveryInfoBring.taxAmount = parseInt(
        priceWithoutAdditionalService["vat"]
      );
    }

    const expectedDelivery = product["expectedDelivery"];
    if (expectedDelivery) {
      const workingDays = expectedDelivery["workingDays"];
      if (workingDays) {
        deliveryInfoBring.estimatedDelivery = moment()
          .add(parseInt(workingDays) + APP_CONFIG.delivery.deliveryDays, "days")
          .toDate();
      }
    }

    return deliveryInfoBring;
  }
}
