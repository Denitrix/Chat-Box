import React, { useEffect, useState } from "react";
import axios from "axios";
import { Buffer } from "buffer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ADD_USER_AVATAR } from "../utils/mutations";
import { useMutation } from "@apollo/client";

import Loader from "./Loader";

const AVATAR_API_URL = `https://api.multiavatar.com/4645646`;

const AvatarSelector = () => {
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(undefined);

  const [addUserAvatar, { error }] = useMutation(ADD_USER_AVATAR);

  const toastOptions = {
    position: "bottom-right",
    autoClose: 1000,
    pauseOnHover: true,
    draggable: true,
    theme: "light",
  };

  //   useEffect(async () => {
  //     if (!localStorage.getItem("user")) navigate("/login");
  //   }, []);

  const setProfilePicture = async () => {
    if (selectedAvatar === undefined) {
      toast.error("Please select an avatar", toastOptions);
    } else {
      const user = await JSON.parse(localStorage.getItem("user"));

      // graphql
      //   const { data } = await axios.post(`${setAvatarRoute}/${user._id}`, {
      //     image: avatars[selectedAvatar],
      //   });

      try {
        const { data } = await addUserAvatar({
          variables: {
            userId: user._id,
            avatar: avatars[selectedAvatar],
          },
        });

        // user.isAvatarImageSet = true;
        // user.avatarImage = data.image;
        console.log("data:", data);
        localStorage.setItem("user", JSON.stringify(data.addUserAvatar));
        window.location.assign("/chat");
      } catch (err) {
        console.error(err);
        setShowAlert(true);
      }
    }
  };

  useEffect(async () => {
    const data = [];
    for (let i = 0; i < 4; i++) {
      const image = await axios.get(
        `${AVATAR_API_URL}/${Math.round(Math.random() * 1000)}`
      );
      const buffer = new Buffer(image.data);
      data.push(buffer.toString("base64"));
    }
    setAvatars(data);
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="container">
          <div className="title-container">
            <h1>Pick an Avatar as your profile picture</h1>
          </div>
          <div className="avatars">
            {avatars.map((avatar, index) => {
              return (
                <div
                  className={`avatar ${
                    selectedAvatar === index ? "selected" : ""
                  }`}
                >
                  <img
                    src={`data:image/svg+xml;base64,${avatar}`}
                    alt="avatar"
                    key={avatar}
                    onClick={() => setSelectedAvatar(index)}
                  />
                </div>
              );
            })}
          </div>
          <button onClick={setProfilePicture} className="submit-btn">
            Set as Profile Picture
          </button>
          <ToastContainer />
        </div>
      )}
    </>
  );
};

export default AvatarSelector;
