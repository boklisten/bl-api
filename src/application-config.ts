export const APP_CONFIG = {
  path: {
    client: {
      checkout: "cart/confirm",
      agreement: {
        rent: "info/agreement/rent",
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
    feide: {
      name: "oauth2",
    },
  },
  token: {
    refresh: {
      iss: "boklisten.no",
      aud: "boklisten.no",
      expiresIn: "1d", // 250d = aprox 8 months
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
    deliveryDays: 7,
  },
};
