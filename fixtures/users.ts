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
];
