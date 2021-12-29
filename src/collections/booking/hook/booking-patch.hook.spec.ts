// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import {
  AccessToken,
  BlError,
  CustomerItem,
  UserDetail,
  Booking,
} from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import sinonChai from "sinon-chai";
import { BookingPatchHook } from "./booking-patch.hook";

const bookingStorage = new BlDocumentStorage<Booking>("bookings");

const testId = "5ea6a45dc39947205e3ecdd8";
const testId2 = "5ea6a45dc39947205e3ecdd1";

const testBooking = {
  id: "booking1",
  customer: "someCustomer",
  from: new Date(),
  to: new Date(),
  branch: "branch1",
};

const testBooking2 = {
  id: "booking2",
  customer: null,
  from: new Date(),
  to: new Date(),
  branch: "branch1",
};

const testBooking3 = {
  customer: testId,
  from: new Date(),
  to: new Date(),
};

const testBooking4 = {
  id: "testBooking4",
  customer: "testBooking4Customer",
  booked: true,
  from: new Date(),
  to: new Date(),
};

sinon.stub(bookingStorage, "get").callsFake((id) => {
  if (id == testBooking.id) {
    return Promise.resolve(testBooking);
  } else if (id == testBooking2.id) {
    return Promise.resolve(testBooking2);
  } else if (id == testBooking4.id) {
    return Promise.resolve(testBooking4);
  } else {
    return Promise.reject(new BlError("not found").code(702));
  }
});

sinon.stub(bookingStorage, "getByQuery").callsFake((query) => {
  if (query.objectIdFilters) {
    if (
      query.objectIdFilters.length &&
      query.objectIdFilters[0].value[0] == testBooking3.customer
    ) {
      return Promise.resolve([testBooking3]);
    }
  }

  return Promise.reject(new BlError("not found").code(702));
});

describe("BookingPatchHook", () => {
  const bookingPatchHook = new BookingPatchHook(bookingStorage);

  describe("#before", () => {
    it("should reject if customer is already attached to booking", () => {
      const updateBody = {
        customer: "testCustomer",
      };

      return expect(
        bookingPatchHook.before(updateBody, {} as any, "booking1")
      ).to.eventually.be.rejectedWith(
        BlError,
        /customer is already attached to booking/
      );
    });

    it("should reject if accessToken.permission is not admin and is trying to update other fields than customer", () => {
      const updateBody = {
        from: new Date(),
        to: new Date(),
        customer: "customer1",
      };

      return expect(
        bookingPatchHook.before(
          updateBody,
          { permission: "customer" } as any,
          "booking2"
        )
      ).to.eventually.be.rejectedWith(
        BlError,
        /can only update 'customer' and 'booked' fields/
      );
    });

    it("should reject if accessToken.id is not equal to booking.customer and accessToken.permission is not admin", () => {
      const updateBody = {
        customer: "customer2",
      };
      return expect(
        bookingPatchHook.before(
          updateBody,
          { details: "customer4", permission: "customer" } as any,
          "booking2"
        )
      ).to.eventually.be.rejectedWith(
        BlError,
        /can only update booking with customers own id/
      );
    });

    it("should reject if customer already has an active booking", () => {
      const updateBody = {
        customer: testId,
      };

      return expect(
        bookingPatchHook.before(
          updateBody,
          { permission: "customer", details: testId } as any,
          "booking2"
        )
      ).to.eventually.be.rejectedWith(
        BlError,
        /customer already has an active booking/
      );
    });

    it("should reject if customer is trying to cancel another customers booking", () => {
      const updateBody = {
        customer: null,
        booked: false,
      };
      const accessToken = {
        details: testId,
        permission: "customer",
      };
      return expect(
        bookingPatchHook.before(updateBody, accessToken as any, "testBooking4")
      ).to.eventually.be.rejectedWith(
        BlError,
        `user "${testId}" has no permission to cancel booking "testBooking4"`
      );
    });

    it("should resolve if user is admin and trying to cancel another users booking", () => {
      const updateBody = {
        customer: null,
        booked: false,
      };
      const accessToken = {
        details: testId,
        permission: "admin",
      };
      return expect(
        bookingPatchHook.before(updateBody, accessToken as any, "testBooking4")
      ).to.eventually.be.true;
    });

    it("should resolve", () => {
      const updateBody = {
        customer: testId2,
      };

      return expect(
        bookingPatchHook.before(
          updateBody,
          { permission: "customer", details: testId2 } as any,
          "booking2"
        )
      ).to.eventually.be.true;
    });
  });

  describe("#after", () => {
    const bookingStorage = new BlDocumentStorage<Booking>("bookings");
    const bookingPatchHook = new BookingPatchHook(bookingStorage);
    const testId3 = "5ea6a45dc39947205e3ecdd3";

    sinon.stub(bookingStorage, "get").callsFake(() => {
      return Promise.resolve({});
    });

    sinon.stub(bookingStorage, "update").callsFake(() => {
      return Promise.resolve(true);
    });

    it("should reject if booking have customer but 'booked' is false", () => {
      const booking = {
        customer: testId3,
        from: new Date(),
        to: new Date(),
        booked: false,
      };

      return expect(
        bookingPatchHook.after([booking as Booking], {
          permission: "customer",
          details: testId3,
        } as any)
      ).to.eventually.be.rejectedWith(
        BlError,
        /booking.customer is set but booked is false/
      );
      /*
      let bookingStorageSpy = sinon.spy(bookingStorage, "update");

      const updateBody = {
        customer: testId2
      };

      try {
        await bookingPatchHook.after([]);
      } catch (e) {}
      */
    });

    it("should reject if booking does not have customer but 'booked' is true", () => {
      const booking = {
        customer: null,
        from: new Date(),
        to: new Date(),
        booked: true,
      };

      return expect(
        bookingPatchHook.after([booking as Booking], {
          permission: "customer",
          details: testId3,
        } as any)
      ).to.eventually.be.rejectedWith(
        BlError,
        /booking.booked is set but customer is null or undefined/
      );
    });
  });
});
