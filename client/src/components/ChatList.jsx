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
import CreateChat from "./CreateChat";
import { Accordion } from "react-bootstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt, faPlus } from "@fortawesome/free-solid-svg-icons";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { QUERY_CHATS, QUERY_USERS } from "../utils/queries";
import { ADD_CHAT } from "../utils/mutations";
import Auth from "../utils/auth";

const ChatList = ({ onClickCallback }) => {
  const currentUser = Auth.getCurrentUser();
  const [search, setSearch] = useState("");
  const [newGroup, setNewGroup] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { loading: loadingChatData, data: chatData } = useQuery(QUERY_CHATS, {
    variables: { chatName: search },
    onCompleted: (data) => {
      console.log(data);
    },
  });
  const { loading: loadingUserData, data: userData } = useQuery(QUERY_USERS, {
    onCompleted: (data) => {
      console.log(data);
    },
  });
  const [addChat, { error }] = useMutation(ADD_CHAT, {
    refetchQueries: [QUERY_CHATS, "chatData"],
  });

  const getOtherUsers = (users) => {
    return users.filter((user) => user._id !== currentUser._id);
  };

  const getOtherUsernames = (users) => {
    return getOtherUsers(users)
      .map((user) => user.username)
      .join(", ");
  };

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
    setSelectedChatId(chat._id);
    onClickCallback(chat);
  };

  return (
    <Sidebar position="left" scrollable={false}>
      <ConversationHeader>
        <Avatar
          name={currentUser.username}
          src={`data:image/svg+xml;base64,${currentUser.avatar}`}
        />
        <ConversationHeader.Content userName={currentUser.username} />
        <ConversationHeader.Actions>
          <Button
            border
            className="btn btn-danger"
            style={{
              backgroundColor: "#016DB3",
              color: "white",
              minWidth: "40px",
              minHeight: "40px",
            }}
            onClick={Auth.logout}
            icon={
              <FontAwesomeIcon icon={faSignOutAlt} className="button-icon" />
            }
          ></Button>
        </ConversationHeader.Actions>
      </ConversationHeader>
      <Search
        placeholder="Search..."
        value={search}
        onChange={(v) => setSearch(v)}
        onClearClick={() => setSearch("")}
      />
      <CreateChat newGroup={newGroup}>
        <Button
          border
          style={{ width: "100%", height: "100%", margin: "0em" }}
          onClick={() => setNewGroup(true)}
          icon={<FontAwesomeIcon icon={faPlus} className="button-icon" />}
        >
          <span className="button-text">New Group</span>
        </Button>
      </CreateChat>

      {loadingChatData || loadingUserData ? (
        <Loader style={{ justifyContent: "center" }}>Loading</Loader>
      ) : (
        <>
          <Accordion defaultActiveKey={["0"]} alwaysOpen>
            <Accordion.Item eventKey="0">
              <Accordion.Header>Chats</Accordion.Header>
              <Accordion.Body>
                <ConversationList>
                  {chatData.allChats.map((chat) => {
                    const otherUsers = getOtherUsers(chat.users);
                    const lastMessage = chat.lastMessage;
                    return (
                      <Conversation
                        key={chat._id}
                        name={chat.chatName}
                        lastSenderName={
                          lastMessage ? lastMessage.sender.username : null
                        }
                        info={
                          lastMessage ? lastMessage.content : "No messages yet"
                        }
                        onClick={() => handleConversationOnClick(chat)}
                        active={selectedChatId === chat._id}
                      >
                        {otherUsers.length > 1 ? (
                          <AvatarGroup size="sm" max={4}>
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
                            src={`data:image/svg+xml;base64,${otherUsers[0].avatar}`}
                          />
                        )}
                      </Conversation>
                    );
                  })}
                </ConversationList>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Users</Accordion.Header>
              <Accordion.Body>
                <ConversationList>
                  {userData.users.map((user) => {
                    return (
                      <Conversation
                        key={user._id}
                        name={user.username}
                        onClick={() => {
                          const chat = {
                            chatName: user.username,
                            users: [{ _id: user._id }],
                          };
                          handleConversationOnClick(chat);
                        }}
                        // active={selectedChatId === chat._id}
                      >
                        <Avatar
                          key={user._id}
                          name={user.username}
                          src={`data:image/svg+xml;base64,${user.avatar}`}
                        />
                      </Conversation>
                    );
                  })}
                </ConversationList>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </>
      )}
    </Sidebar>
  );
};

export default ChatList;
