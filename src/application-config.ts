import moment from "moment";

export const APP_CONFIG = {
  path: {
    client: {
      checkout: "cart/confirm",
      agreement: {
        rent: "info/policies/conditions",
      },
      auth: {
        failure: "auth/authentication/failure",
        socialLoginFailure: "auth/social/failure",
      },
    },
    dibs: {
      payment: "payments",
    },
    host: "boklisten",
    dev: {
      host: "test.boklisten",
    },
    local: {
      host: "localhost",
    },
  },
  server: {
    basePath: "http://localhost:1337",
  },
  url: {
    bring: {
      shipmentInfo: "https://api.bring.com/shippingguide/v2/products",
    },
    blWeb: {
      base: "https://localhost:4200",
    },
  },
  dev: {
    server: {
      host: "https://localhost",
      port: 1337,
      path: "api",
      version: "v1",
    },
    client: {
      base: "https://localhost:4200/",
    },
    mongoDb: {
      basePath: "mongodb://",
      host: "localhost",
      port: 27017,
      dbName: "bl_dev_environment",
    },
    redis: {
      basePath: "",
      host: "",
      port: 0,
      dbName: "",
    },
  },
  prod: {
    server: {
      host: "",
      port: 0,
      path: "",
      version: "",
    },
    mongoDb: {
      basePath: "",
      host: "",
      port: 0,
      dbName: "",
    },
    redis: {
      basePath: "",
      host: "",
      port: 0,
      dbName: "",
    },
  },
  test: true,
  login: {
    google: {
      name: "google",
    },
    facebook: {
      name: "facebook",
    },
    local: {
      name: "local",
    },
  },
  token: {
    refresh: {
      iss: "boklisten.no",
      aud: "boklisten.no",
      expiresIn: "365d", // 250d = aprox 8 months
    },
    access: {
      iss: "boklisten.no",
      aud: "boklisten.no",
      expiresIn: "10 minutes",
    },
  },
  date: {
    cancelDays: 14,
  },
  payment: {
    paymentServiceConfig: {
      roundDown: true,
      roundUp: false,
    },
  },
  delivery: {
    // If in season, lower the delivery estimate
    deliveryDays:
      moment().isBetween(
        moment().set({ month: 7, day: 9 }),
        moment().set({ month: 8, day: 10 }),
      ) ||
      moment().isBetween(
        moment().set({ month: 0, day: 7 }),
        moment().set({ month: 1, day: 8 }),
      )
        ? 4
        : 7,
    maxWeightLetter: 4800,
  },
};
