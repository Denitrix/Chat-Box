const typeDefs = `
  type User {
    _id: ID!
    username: String!
    email: String!
    password: String
    avatar: String
    createdAt: String
    updatedAt: String
  }

  input UserInput {
    _id: ID!
  }

  type Chat {
    _id: ID!
    chatName: String
    users: [User]!
    groupAdmin: User
    lastMessage: Message
    createdAt: String
    updatedAt: String
  }

  type Message {
    _id: ID!
    content: String!
    sender: User!
    chat: Chat
    createdAt: String
    updatedAt: String
  }

  type Query {
    me: User
    users(userSearch: String): [User]
    allChats(chatName: String): [Chat]
    singleChat(chatId: ID!): Chat
    messages(chatId: ID!): [Message]
  }

  type Mutation {
    login(email: String!, password: String!): Auth
    addUser(username: String!, email: String!, password: String!): Auth
    addUserAvatar(userId: ID!, avatar: String!): User
    addChat(chatName: String!, users: [UserInput]!): Chat
    editChat(chatId: ID!, chatName: String!, users: [UserInput]!): Chat
    addMessage(content: String!, chatId: ID!): Message
  }

  type Auth {
    token: ID!
    user: User
  }

  type Subscription {
  messageAdded(chatId: ID!): Message
  chatEdited(userId:ID!): Chat
}
`;

module.exports = typeDefs;
