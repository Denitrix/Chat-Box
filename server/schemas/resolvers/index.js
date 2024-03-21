const userResolvers = require("./userResolvers");
const chatResolvers = require("./chatResolvers");
const messageResolvers = require("./messageResolvers");

const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...chatResolvers.Query,
    ...messageResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...chatResolvers.Mutation,
    ...messageResolvers.Mutation,
  },
  Subscription: {
    ...messageResolvers.Subscription,
    ...chatResolvers.Subscription,
  },
};

module.exports = resolvers;
