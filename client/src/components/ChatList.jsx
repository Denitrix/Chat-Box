import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  Sidebar,
  Search,
  Conversation,
  ConversationHeader,
  ConversationList,
  Button,
  Loader,
  Avatar,
  AvatarGroup,
} from "@chatscope/chat-ui-kit-react";
import CreateGroup from "./CreateGroup";
import { Accordion } from "react-bootstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faPlus } from "@fortawesome/free-solid-svg-icons";

import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useLazyQuery,
  useSubscription,
} from "@apollo/client";
import { QUERY_CHATS, QUERY_USERS, CHAT_SUBSCRIPTION } from "../utils/queries";
import { ADD_CHAT } from "../utils/mutations";
import Auth from "../utils/auth";

const ChatList = ({
  onClickCallback,
  conversationAvatarStyle,
  conversationContentStyle,
  sidebarStyle,
  activeChat,
}) => {
  const currentUser = Auth.getCurrentUser();
  const [search, setSearch] = useState("");
  const [newGroup, setNewGroup] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const {
    loading: loadingChatData,
    data: chatData,
    refetch,
  } = useQuery(QUERY_CHATS, {
    variables: { chatName: search },
    onCompleted: (data) => {
      console.log("Query: allChats", data);
    },
  });
  const [searchUsers, { loading: loadingUserData, data: userData }] =
    useLazyQuery(QUERY_USERS, {
      onCompleted: (data) => {
        console.log("Query: users", data);
      },
    });
  const [addChat, { error }] = useMutation(ADD_CHAT, {
    refetchQueries: [QUERY_CHATS, "allChats"],
    onCompleted: (d) => {
      const chat = d.addChat;
      handleConversationOnClick(chat);
      console.log("Mutation: addChat", chat);
    },
  });

  const getOtherUsers = (users) => {
    return users.filter((user) => user._id !== currentUser._id);
  };

  const getOtherUsernames = (users) => {
    return getOtherUsers(users)
      .map((user) => user.username)
      .join(", ");
  };
  const { data: subData, loading: subLoading } = useSubscription(
    CHAT_SUBSCRIPTION,
    {
      variables: { userId: currentUser._id },
      onComplete: (d) => {
        console.log("subData", d);
      },
      onError: (err) => {
        console.log("WS", err);
      },
    }
  );
  useEffect(() => {
    // getMessages();
    refetch();
    console.log("Chats Updated");
  }, [subData, subLoading]);

  const [windowDimensions, setWindowDimensions] = useState(window.innerWidth);
  useEffect(() => {
    function handleResize() {
      setWindowDimensions(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleConversationOnClick = async (chat) => {
    console.log("handle conversation click");
    if (!chat._id) {
      const { data } = await addChat({
        variables: {
          chatName: chat.chatName,
          users: chat.users,
        },
      });
      console.log(data.addChat);

      chat = data.addChat;
    }
    console.log("Selected:", chat);
    setSelectedChatId(chat._id);
    onClickCallback(chat);
  };

  return (
    <Sidebar position="left" scrollable={false} style={sidebarStyle}>
      <ConversationHeader>
        <Avatar
          name={currentUser.username}
          src={`data:image/svg+xml;base64,${currentUser.avatar}`}
        />
        <ConversationHeader.Content userName={currentUser.username} />
        <ConversationHeader.Actions>
          {!(768 >= windowDimensions && windowDimensions >= 579) && (
            <Button
              border
              className="logout-button"
              style={{}}
              onClick={Auth.logout}
              icon={
                <FontAwesomeIcon icon={faSignOutAlt} className="button-icon" />
              }
            ></Button>
          )}
        </ConversationHeader.Actions>
      </ConversationHeader>
      <CreateGroup
        newGroup={newGroup}
        style={{ marginTop: "0.5em" }}
        onCreate={(variables) => {
          console.log("test");
          addChat({ ...variables() });
        }}
      >
        <Button
          border
          style={{ width: "100%", height: "100%", margin: "0em" }}
          onClick={() => setNewGroup(true)}
          icon={<FontAwesomeIcon icon={faPlus} className="button-icon" />}
        >
          <span className="button-text">New Group</span>
        </Button>
      </CreateGroup>
      <Search
        placeholder="Search..."
        value={search}
        onChange={(v) => setSearch(v)}
        onClearClick={() => setSearch("")}
        id="chatSearch"
      />

      {loadingChatData ? (
        <Loader style={{ justifyContent: "center" }}>Loading</Loader>
      ) : (
        <>
          <ConversationList>
            {chatData.allChats.map((chat) => {
              const otherUsers = getOtherUsers(chat.users);
              const lastMessage = chat.lastMessage;
              return (
                <Conversation
                  key={chat._id}
                  onClick={() => handleConversationOnClick(chat)}
                  active={activeChat && activeChat._id === chat._id}
                >
                  {otherUsers.length > 1 ? (
                    <AvatarGroup
                      size="sm"
                      max={4}
                      style={conversationAvatarStyle}
                    >
                      {otherUsers.map((user) => {
                        return (
                          <Avatar
                            key={user._id}
                            name={user.username}
                            src={`data:image/svg+xml;base64,${user.avatar}`}
                          />
                        );
                      })}
                    </AvatarGroup>
                  ) : (
                    <Avatar
                      key={otherUsers[0]._id}
                      name={otherUsers[0].username}
                      style={conversationAvatarStyle}
                      src={`data:image/svg+xml;base64,${otherUsers[0].avatar}`}
                    />
                  )}
                  <Conversation.Content
                    name={
                      otherUsers.length > 1
                        ? chat.chatName
                        : otherUsers[0].username
                    }
                    lastSenderName={
                      lastMessage ? lastMessage.sender.username : null
                    }
                    info={lastMessage ? lastMessage.content : "No messages yet"}
                    style={conversationContentStyle}
                  ></Conversation.Content>
                </Conversation>
              );
            })}
          </ConversationList>
        </>
      )}
      {768 >= windowDimensions && windowDimensions >= 579 && (
        <Button
          border
          className="logout-button"
          style={{}}
          onClick={Auth.logout}
          icon={<FontAwesomeIcon icon={faSignOutAlt} className="button-icon" />}
        ></Button>
      )}
    </Sidebar>
  );
};

export default ChatList;
