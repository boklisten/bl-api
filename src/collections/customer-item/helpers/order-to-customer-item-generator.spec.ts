import "mocha";
import * as chai from "chai";
import * as sinon from "sinon";
import { expect } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import {
  BlError,
  Branch,
  CustomerItem,
  Order,
  OrderItem,
  UserDetail
} from "@wizardcoder/bl-model";
import { OrderToCustomerItemGenerator } from "./order-to-customer-item-generator";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";

chai.use(chaiAsPromised);

describe("OrderToCustomerItemGenerator", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("userdetails");

  const userDetail = {
    id: "customer1",
    name: "Hans Hansen",
    email: "hanshansen@hansen.com",
    phone: "123456789",
    address: "hanseveien 10",
    postCode: "1234",
    postCity: "oslo",
    dob: new Date(),
    branch: "branch1",
    guardian: {
      name: "Lathans Hansen",
      email: "lathanshansen@hansen.com",
      phone: "123456789"
    }
  };

  sinon.stub(userDetailStorage, "get").callsFake(id => {
    if (id === userDetail.id) {
      return userDetail;
    } else {
      throw new BlError("not found").code(702);
    }
  });

  const generator = new OrderToCustomerItemGenerator(userDetailStorage);

  describe("generate()", () => {
    it('should return customer-item type "partly-payment', () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "partly-payment",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 100,
        unitPrice: 100,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1,
          amountLeftToPay: 200,
          customerItem: ""
        }
      };

      const order: Order = {
        id: "order1",
        amount: 100,
        orderItems: [orderItem],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const expectedResult = [
        {
          id: null,
          item: orderItem.item,
          type: "partly-payment",
          age: orderItem.age,
          customer: order.customer,
          deadline: orderItem.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          amountLeftToPay: orderItem["info"]["amountLeftToPay"],
          totalAmount: orderItem.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        }
      ];

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql(expectedResult);
    });

    it('should return multiple customer-items when more than one order-item has type "partly-payment', () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "partly-payment",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 100,
        unitPrice: 100,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1,
          amountLeftToPay: 200,
          customerItem: ""
        }
      };

      const orderItem2: OrderItem = {
        type: "partly-payment",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 110,
        unitPrice: 110,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "year",
          numberOfPeriods: 1,
          amountLeftToPay: 210,
          customerItem: ""
        }
      };

      const order: Order = {
        id: "order1",
        amount: 100,
        orderItems: [orderItem, orderItem2],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const expectedResult = [
        {
          id: null,
          item: orderItem.item,
          type: "partly-payment",
          age: orderItem.age,
          customer: order.customer,
          deadline: orderItem.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          amountLeftToPay: orderItem["info"]["amountLeftToPay"],
          totalAmount: orderItem.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        },
        {
          id: null,
          item: orderItem2.item,
          type: "partly-payment",
          age: orderItem2.age,
          customer: order.customer,
          deadline: orderItem2.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          amountLeftToPay: orderItem2["info"]["amountLeftToPay"],
          totalAmount: orderItem2.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        }
      ];

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql(expectedResult);
    });

    it("should return empty array if no order-item shall be converted to customer-items when more than one order-item", () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "extend",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 100,
        unitPrice: 100,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1,
          amountLeftToPay: 200,
          customerItem: ""
        }
      };

      const orderItem2: OrderItem = {
        type: "buy",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 110,
        unitPrice: 110,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "year",
          numberOfPeriods: 1,
          amountLeftToPay: 210,
          customerItem: ""
        }
      };

      const order: Order = {
        id: "order1",
        amount: 100,
        orderItems: [orderItem, orderItem2],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql([]);
    });

    it('should return customer-item type "rent"', () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "rent",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const order: Order = {
        id: "order1",
        amount: 0,
        orderItems: [orderItem],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const expectedResult = [
        {
          id: null,
          item: orderItem.item,
          type: "rent",
          age: orderItem.age,
          customer: order.customer,
          deadline: orderItem.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        }
      ];

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql(expectedResult);
    });

    it('should return multiple customer-items with type "rent"', () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "rent",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const orderItem2: OrderItem = {
        type: "rent",
        item: "item1",
        title: "signatur 2",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const order: Order = {
        id: "order1",
        amount: 0,
        orderItems: [orderItem, orderItem2],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const expectedResult = [
        {
          id: null,
          item: orderItem.item,
          type: "rent",
          age: orderItem.age,
          customer: order.customer,
          deadline: orderItem.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        },
        {
          id: null,
          item: orderItem2.item,
          type: "rent",
          age: orderItem2.age,
          customer: order.customer,
          deadline: orderItem2.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem2.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        }
      ];

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql(expectedResult);
    });

    it('should return multiple customer-items with type "loan"', () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "loan",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const orderItem2: OrderItem = {
        type: "loan",
        item: "item1",
        title: "signatur 2",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const order: Order = {
        id: "order1",
        amount: 0,
        orderItems: [orderItem, orderItem2],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const expectedResult = [
        {
          id: null,
          item: orderItem.item,
          type: "loan",
          age: orderItem.age,
          customer: order.customer,
          deadline: orderItem.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        },
        {
          id: null,
          item: orderItem2.item,
          type: "loan",
          age: orderItem2.age,
          customer: order.customer,
          deadline: orderItem2.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem2.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        }
      ];

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql(expectedResult);
    });

    it('should return multiple customer-items with types "loan", "rent" and "partly-payment"', () => {
      const deadline = new Date(2100, 1, 1);
      const today = new Date();

      const orderItem: OrderItem = {
        type: "loan",
        item: "item1",
        title: "signatur",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const orderItem2: OrderItem = {
        type: "rent",
        item: "item1",
        title: "signatur 2",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const orderItem3: OrderItem = {
        type: "partly-payment",
        item: "item1",
        title: "signatur 3",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const orderItem4: OrderItem = {
        type: "buy",
        item: "item1",
        title: "signatur 4",
        age: "new",
        amount: 0,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        info: {
          from: today,
          to: deadline,
          periodType: "semester",
          numberOfPeriods: 1
        }
      };

      const order: Order = {
        id: "order1",
        amount: 0,
        orderItems: [orderItem, orderItem2, orderItem3, orderItem4],
        branch: "branch1",
        customer: "customer1",
        byCustomer: false,
        employee: "employee1",
        payments: [],
        delivery: "delivery1",
        creationTime: today
      };

      const expectedResult = [
        {
          id: null,
          item: orderItem.item,
          type: "loan",
          age: orderItem.age,
          customer: order.customer,
          deadline: orderItem.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        },
        {
          id: null,
          item: orderItem2.item,
          type: "rent",
          age: orderItem2.age,
          customer: order.customer,
          deadline: orderItem2.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          totalAmount: orderItem2.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        },
        {
          id: null,
          item: orderItem3.item,
          type: "partly-payment",
          age: orderItem3.age,
          customer: order.customer,
          deadline: orderItem3.info.to,
          handout: true,
          handoutInfo: {
            handoutBy: "branch",
            handoutById: order.branch,
            handoutEmployee: order.employee,
            time: today
          },
          returned: false,
          amountLeftToPay: orderItem3["info"]["amountLeftToPay"],
          totalAmount: orderItem3.amount,
          orders: [order.id],
          customerInfo: {
            name: userDetail.name,
            phone: userDetail.phone,
            address: userDetail.address,
            postCode: userDetail.postCode,
            postCity: userDetail.postCity,
            dob: userDetail.dob,
            guardian: userDetail.guardian
          }
        }
      ];

      const result = generator.generate(order);
      return expect(result).to.eventually.be.eql(expectedResult);
    });
  });
});