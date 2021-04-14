import { openingHourSchema } from "../opening-hour.schema";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { OpeningHour, Branch, BlError } from "@boklisten/bl-model";
import moment from "moment-timezone";

export class OpeningHourHelper {
  constructor(private openingHourStorage?: BlDocumentStorage<OpeningHour>) {
    this.openingHourStorage = this.openingHourStorage
      ? this.openingHourStorage
      : new BlDocumentStorage<OpeningHour>("openinghours", openingHourSchema);
  }

  public async getNextAvailableOpeningHour(
    branch: Branch,
    after?: Date
  ): Promise<OpeningHour> {
    if (!branch.openingHours || branch.openingHours.length <= 0) {
      throw new BlError("no opening hours found at branch");
    }

    let firstAvailableOpeningHour;

    try {
      const openingHours = await this.openingHourStorage.getMany(
        branch.openingHours as string[]
      );

      firstAvailableOpeningHour = this.getFirstAvailableOpeningHour(
        openingHours,
        after
      );
    } catch (e) {
      throw e;
    }

    if (!firstAvailableOpeningHour) {
    }

    return firstAvailableOpeningHour;
  }

  private getFirstAvailableOpeningHour(
    openingHours: OpeningHour[],
    after?: Date
  ): OpeningHour {
    let firstAvailableOpeningHour;

    for (let openingHour of openingHours) {
      if (moment(openingHour.from).isAfter(moment())) {
        if (
          !firstAvailableOpeningHour ||
          moment(openingHour.from).isBefore(firstAvailableOpeningHour.from)
        ) {
          if (after) {
            if (moment(openingHour.from).isAfter(after)) {
              firstAvailableOpeningHour = openingHour;
            }
          } else {
            firstAvailableOpeningHour = openingHour;
          }
        }
      }
    }

    if (firstAvailableOpeningHour) {
      return firstAvailableOpeningHour;
    } else {
      throw new BlError("no opening hours are found to be valid");
    }
  }
}
