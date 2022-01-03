// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectId = require("mongodb").ObjectID;

module.exports = [
  {
    _id: ObjectId("61cded5a8f6c5c0047a21b4f"),
    valid: false,
    active: true,
    lastActive: new Date("2021-12-29T18:39:37.536Z"),
    lastUpdated: new Date("2021-12-29T18:39:37.536Z"),
    creationTime: new Date("2021-12-29T18:39:37.536Z"),
    viewableFor: [],
    editableFor: [],
    archived: false,
    userDetail: ObjectId("61cded5a8f6c5c0047a21b4a"),
    permission: "customer",
    blid: "u#cafac7b249c46e13bdb2e77b61b6f856",
    username: "richard.stallman@protonmail.com",
    login: {
      provider: "local",
      providerId:
        "4b3ee0577019bfe610259496c39cd5c954cfdcfccc8ec4eea604a1ff745e2020",
    },
    user: { id: "u#cafac7b249c46e13bdb2e77b61b6f856", permission: "customer" },
    comments: [],
    __v: 0,
  },
  {
    _id: ObjectId("61d35c6b48bf8900475f88fe"),
    valid: false,
    active: true,
    lastActive: new Date("2021-12-29T18:39:37.536Z"),
    lastUpdated: new Date("2021-12-29T18:39:37.536Z"),
    creationTime: new Date("2021-12-29T18:39:37.536Z"),
    viewableFor: [],
    editableFor: [],
    archived: false,
    userDetail: ObjectId("61d35c6b48bf8900475f88f9"),
    permission: "admin",
    blid: "u#a780f3f6113eebf992af700d7b834ed5",
    username: "admin@adminsen.no",
    login: {
      provider: "local",
      providerId:
        "d1917aa3db1e325b467495ab37360f37879ec87546e6f3a1cf063c05a486c7b3",
    },
    user: { id: "u#a780f3f6113eebf992af700d7b834ed5", permission: "customer" },
    comments: [],
    __v: 0,
  },
];
