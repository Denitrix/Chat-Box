import {
  useQuery,
  useMutation,
  useLazyQuery,
  useSubscription,
} from "@apollo/client";
import {
  QUERY_MESSAGES,
  SINGLE_CHAT,
  MESSAGES_SUBSCRIPTION,
} from "../utils/queries";
import { ADD_MESSAGE, EDIT_CHAT } from "../utils/mutations";
import Picker from "emoji-picker-react";
import CreateGroup from "./CreateGroup";

import {
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  SendButton,
  Avatar,
  ConversationHeader,
  Button,
  AvatarGroup,
  Loader,
} from "@chatscope/chat-ui-kit-react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Auth from "../utils/auth";

const ChatWindow = ({ activeChat, onClickCallback, chatContainerStyle }) => {
  const currentUser = Auth.getCurrentUser();
  const [windowDimensions, setWindowDimensions] = useState(window.innerWidth);
  const [messageInputValue, setMessageInputValue] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [newGroup, setNewGroup] = useState(false);
  const [thisChat, setThisChat] = useState(activeChat);
  const [avatarSize, setAvatarSize] = useState("md");
  const [maxUsers, setMaxUsers] = useState(10);
  const [isSquare, setIsSquare] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const inputRef = useRef();
  const emojiPickerRef = useRef(null);

  const { data: subData, loading: subLoading } = useSubscription(
    MESSAGES_SUBSCRIPTION,
    {
      variables: { chatId: thisChat._id },
      onComplete: (d) => {
        console.log("subData", d);
      },
      onError: (err) => {
        console.log("WS", err);
      },
    }
  );

  const [addMessage, { error }] = useMutation(ADD_MESSAGE, {
    refetchQueries: [QUERY_MESSAGES, "messages"],
    onCompleted: (data) => {
      console.log("Mutation: ADD_MESSAGE", data);
    },
  });
  const [getMessages, { loading, data, subscribeToMore, refetch }] =
    useLazyQuery(QUERY_MESSAGES, {
      variables: { chatId: activeChat._id },
      onCompleted: (d) => {
        setAllMessages(d.messages);
        console.log("Query: QUERY_MESSAGES", d);
      },
    });
  const [singleChat, { loading: chatLoading, data: chatData }] = useLazyQuery(
    SINGLE_CHAT,
    {
      variables: { chatId: activeChat._id },
      onCompleted: (d) => {
        const chat = d.singleChat;
        setThisChat(chat);
        console.log("Query: SINGLE_CHAT", chat);
      },
    }
  );
  const [editChat, { loading: editLoading }] = useMutation(EDIT_CHAT, {
    onCompleted: (d) => {
      const chat = d.editChat;
      if (chat.users.length <= 1) {
        console.log("Deleted:", chat);
        window.location.reload();
      }
      singleChat();
      console.log("Mutation: editChat", chat);
    },
  });

  useEffect(() => {
    getMessages();
  }, []);
  useEffect(() => {
    setThisChat(activeChat);
    singleChat();
    getMessages();
    refetch();
  }, [activeChat]);
  useEffect(() => {
    function handleResize() {
      setWindowDimensions(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (windowDimensions >= 1024) {
      setAvatarSize("md");
      setMaxUsers(10);
      setIsSquare(false);
    } /* else if (windowDimensions >= 893) {
      setAvatarSize("md");
      setMaxUsers(10);
      setIsSquare(false);
    } */ else if (windowDimensions >= 769) {
      setAvatarSize("md");
      setMaxUsers(4);
      setIsSquare(false);
    } else if (windowDimensions >= 577) {
      setAvatarSize("md");
      setMaxUsers(6);
      setIsSquare(false);
    } else {
      setAvatarSize("sm");
      setMaxUsers(4);
      setIsSquare(true);
    }
  }, [windowDimensions]);
  /* useEffect(() => {
    subscribeToMore({
      document: QUERY_MESSAGES,
      variables: { chatId: activeChat._id },
      updateQuery: (prev, { subscriptionData }) => {
        setAllMessages(prev.messages);
        console.log("prev", prev);
        if (!subscriptionData.data) {
          setAllMessages(prev.messages);
        } else {
          console.log("subscriptionData", subscriptionData.data);
          setAllMessages(subscriptionData.data.messages);
        }
      },
    });
  }, []); */
  useEffect(() => {
    getMessages();
    /* if (!subLoading) {
      const newMessage = subData.messageAdded;
      if (newMessage.chat._id === thisChat._id) {
        setAllMessages([...allMessages, newMessage]);
        console.log("New Message added", subData);
      }
      console.log("New Message not added", subData);
    } */
    refetch();
  }, [subData, subLoading]);

  const getOtherUsers = (users) => {
    return users.filter((user) => user._id !== currentUser._id);
  };
  const otherUsers = getOtherUsers(thisChat.users);

  const handleEmojiPickerHideShow = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };
  const handleClickOutside = (event) => {
    if (
      emojiPickerRef.current &&
      !emojiPickerRef.current.contains(event.target) &&
      !event.target.classList.contains("emoji-icon")
    ) {
      setShowEmojiPicker(false);
    }
  };
  const handleEmojiClick = (emoji, event) => {
    let msg = messageInputValue;
    console.log("emoji:", emoji);
    msg += emoji.emoji;
    setMessageInputValue(msg);
  };
  const handleSend = async (message) => {
    const { data } = await addMessage({
      variables: {
        content: message,
        chatId: thisChat._id,
      },
    });

    setMessageInputValue("");
  };

  const renderMessages = useCallback(() => {
    return (
      !loading &&
      allMessages.map((message) => {
        const createdAt = new Date(parseInt(message?.createdAt));
        const sentAt = createdAt.toLocaleDateString("en-us", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return (
          <Message
            key={message._id}
            model={{
              message: message?.content,
              sentTime: sentAt,
              sender: message?.sender?.username,
              direction:
                message?.sender?._id === currentUser?._id
                  ? "outgoing"
                  : "incoming",
              position: "single",
            }}
          >
            <Avatar
              name={message?.sender?.username}
              src={`data:image/svg+xml;base64,${message?.sender?.avatar}`}
            />

            <Message.Footer
              sender={message?.sender?.username}
              sentTime={sentAt}
            />
          </Message>
        );
      })
    );
  }, [allMessages]);
  /* useMemo(() => {
    getMessages();
    setAllMessages(data?.messages);
  }, [data]); */

  if (loading) {
    return <Loader style={{ margin: "auto" }}>Loading</Loader>;
  }

  return (
    <>
      <ChatContainer style={chatContainerStyle}>
        <ConversationHeader className="test-class">
          <ConversationHeader.Back onClick={onClickCallback} />
          {otherUsers.length > 1 ? (
            <AvatarGroup
              size={avatarSize}
              max={maxUsers}
              style={isSquare ? { width: "43px", height: "43ps" } : {}}
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
              src={`data:image/svg+xml;base64,${otherUsers[0].avatar}`}
            />
          )}
          <ConversationHeader.Content
            userName={
              otherUsers.length > 1 ? thisChat.chatName : otherUsers[0].username
            }
          />
          <ConversationHeader.Actions>
            <CreateGroup
              newGroup={newGroup}
              onEdit={(func) => {
                const vars = func();
                if (vars.chatName === "") {
                  setThisChat(null);
                  editChat({ ...vars, users: [] });
                } else {
                  editChat({ ...vars });
                }
              }}
              activeChat={thisChat}
            >
              <Button
                border
                style={{ padding: "3.2px 0.3em", margin: "0", height: "100%" }}
                onClick={() => setNewGroup(false)}
                labelPosition="left"
                icon={
                  <FontAwesomeIcon
                    icon={faGear}
                    className="button-icon"
                    style={{ margin: "0" }}
                  />
                }
              >
                <span className="edit-text">Edit Group </span>
              </Button>
            </CreateGroup>
          </ConversationHeader.Actions>
        </ConversationHeader>
        <MessageList>{renderMessages()}</MessageList>

        <div
          as={MessageInput}
          style={{
            display: "flex",
            flexDirection: "row",
            borderTop: "1px dashed #d1dbe4",
          }}
        >
          <div className="emoji" style={{}}>
            <div
              onClick={handleEmojiPickerHideShow}
              style={{
                fontSize: "1.7em",
                marginTop: "0.05em",
                marginLeft: "0.5em",
                marginRight: "-0.1em",
              }}
              className="emoji-icon"
            >
              😃
            </div>
            {showEmojiPicker && (
              <div ref={emojiPickerRef}>
                <Picker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          <div
            as={MessageInput}
            style={{
              display: "flex",
              flexDirection: "row",
              borderTop: "1px dashed #d1dbe4",
              width: "100%",
            }}
          >
            <MessageInput
              ref={inputRef}
              onChange={(msg) => setMessageInputValue(msg)}
              value={messageInputValue}
              sendButton={false}
              onSend={() => handleSend(messageInputValue)}
              attachButton={false}
              style={{
                flexGrow: 1,
                borderTop: 0,
                flexShrink: "initial",
                marginRight: "0em",
              }}
            />
            <SendButton
              border
              onClick={() => handleSend(messageInputValue)}
              disabled={messageInputValue.length === 0}
              style={{
                width: "65px",
                minWidth: "65px",
              }}
            />
          </div>
        </div>
      </ChatContainer>
    </>
  );
};

export default ChatWindow;
