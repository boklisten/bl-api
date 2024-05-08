// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ObjectId = require("mongodb").ObjectID;

const hourInMs = 3600000;
const dayInMs = 24 * hourInMs;
const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();

module.exports = [
  {
    _id: new ObjectId("61dc4814ad783d00461e1267"),
    lastUpdated: new Date(),
    creationTime: new Date(),
    active: true,
    viewableFor: [],
    editableFor: [],
    archived: false,
    from: new Date(today - 5 * dayInMs - 10 * hourInMs),
    to: new Date(today - 5 * dayInMs - 16 * hourInMs),
    branch: new ObjectId("5b6442ebd2e733002fae8a2f"),
    user: { id: "u#dd3ca358e9721cf8f0aa71da8549bbf6", permission: "admin" },
    comments: [],
    __v: 0,
  },
  {
    _id: new ObjectId("61dc480fad783d00461e1263"),
    lastUpdated: new Date(),
    creationTime: new Date(),
    active: true,
    viewableFor: [],
    editableFor: [],
    archived: false,
    from: new Date(today + 5 * dayInMs + 11 * hourInMs),
    to: new Date(today + 5 * dayInMs + 15 * hourInMs),
    branch: new ObjectId("5b6442ebd2e733002fae8a2f"),
    user: { id: "u#dd3ca358e9721cf8f0aa71da8549bbf6", permission: "admin" },
    comments: [],
    __v: 0,
  },
  {
    _id: new ObjectId("61dc47f5ad783d00461e123d"),
    lastUpdated: new Date(),
    creationTime: new Date(),
    active: true,
    viewableFor: [],
    editableFor: [],
    archived: false,
    from: new Date(today + 7 * dayInMs + 9 * hourInMs),
    to: new Date(today + 7 * dayInMs + 12 * hourInMs),
    branch: new ObjectId("5b6442ebd2e733002fae8a2f"),
    user: { id: "u#dd3ca358e9721cf8f0aa71da8549bbf6", permission: "admin" },
    comments: [],
    __v: 0,
  },
  {
    _id: new ObjectId("61dc480fad783d00461e1221"),
    lastUpdated: new Date(),
    creationTime: new Date(),
    active: true,
    viewableFor: [],
    editableFor: [],
    archived: false,
    from: new Date(today + 7 * dayInMs + 9 * hourInMs),
    to: new Date(today + 7 * dayInMs + 12 * hourInMs),
    branch: new ObjectId("5b6442ebd2e733002fae1a1a"),
    user: { id: "u#dd3ca358e9721cf8f0aa71da8549bbf6", permission: "admin" },
    comments: [],
    __v: 0,
  },
];
