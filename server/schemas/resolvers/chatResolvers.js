const { Chat, User, Message } = require("../../models/index");
const { AuthenticationError } = require("../../utils/auth");
const { PubSub, withFilter } = require("graphql-subscriptions");

const pubsub = new PubSub();
const chatResolvers = {
  Query: {
    allChats: async (parent, { chatName }, context) => {
      if (context.user) {
        if (chatName) {
          const users = await User.where({
            $and: [
              { username: { $regex: chatName, $options: "i" } },
              { _id: { $ne: context.user._id } },
            ],
          }).select("_id username");

          console.log("\n\nUsers:", users);

          const chats = await Chat.find({
            $and: [
              { users: { _id: context.user._id } },
              {
                $or: [
                  { users: { $in: users } },
                  { chatName: { $regex: chatName, $options: "i" } },
                ],
              },
            ],
          })
            .populate({
              path: "users",
              select: ["username", "email", "avatar"],
            })
            .populate({
              path: "lastMessage",
              select: ["content", "sender", "chat"],
              populate: {
                path: "sender",
                select: ["username", "avatar"],
              },
            })
            .sort({ updatedAt: "desc" });

          return chats;
        } else {
          // find chats which contain a user with the current user's id
          const chats = await Chat.find({
            users: { _id: context.user._id },
          })
            .populate({
              path: "lastMessage",
              select: ["content", "sender", "chat"],
              populate: {
                path: "sender",
                select: ["username", "avatar"],
              },
            })
            .populate({
              path: "users",
              select: ["username", "email", "avatar"],
            })
            .sort({ updatedAt: "desc" });
          return chats;
        }
      }
      throw AuthenticationError;
    },
    singleChat: async (parent, { chatId }, context) => {
      const { groupAdmin } = await Chat.findById(chatId);

      const chat = await Chat.findById(chatId)
        .populate({
          path: "users",
          /* match: { _id: { $ne: groupAdmin } }, */ //don't include groupAdmin in users
          select: ["username", "email", "avatar"],
        })
        .populate({
          path: "groupAdmin",
          select: ["username", "email", "avatar"],
        });
      return chat;
    },
  },
  Mutation: {
    addChat: async (parent, { chatName, users }, context) => {
      // find current user by id
      const me = await User.findById(context.user._id, {
        __v: false,
        createdAt: false,
        updatedAt: false,
        password: false,
      });
      // adds current user to array of users
      users.push(me);
      // creates a chat with the entered name and user array
      const chat = (
        await Chat.create({ chatName, users, groupAdmin: me })
      ).populate({
        path: "users",
        select: ["_id", "username", "email", "avatar"],
      });

      return chat;
    },
    editChat: async (parent, { chatId, chatName, users }, context) => {
      // creates a chat with the entered name and user array
      const { groupAdmin } = await Chat.findById(chatId);

      if (groupAdmin.toString() === context.user._id) {
        const me = await User.findById(context.user._id, {
          __v: false,
          createdAt: false,
          updatedAt: false,
          password: false,
        });
        // adds current user to array of users
        users.push(me);
        const updatedChat = await Chat.findByIdAndUpdate(
          chatId,
          { $set: { chatName: chatName, users: users } },
          { new: true }
        )
          .populate({
            path: "users",
            select: ["username", "email", "avatar"],
          })
          .populate({
            path: "groupAdmin",
            select: ["username", "email", "avatar"],
          });
        //push to subscription
        pubsub.publish("EDIT_CHAT", { chatEdited: updatedChat });
        if (updatedChat.users.length <= 1) {
          const deletedChat = await Chat.findByIdAndDelete(chatId);
          console.log("Deleted", deletedChat.chatName);
          const deletedMessages = await Message.deleteMany({
            chat: { _id: chatId },
          });
          console.log("Deleted Messages:", deletedMessages);
          return updatedChat;
        }

        return updatedChat;
      }

      throw AuthenticationError;
    },
  },
  Subscription: {
    chatEdited: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(["EDIT_CHAT"]),
        (payload, variables) => {
          console.log("payload verification");
          return payload.user._id === variables.userId;
        }
      ),
    },
  },
};

module.exports = chatResolvers;
