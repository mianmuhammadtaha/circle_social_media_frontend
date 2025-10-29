import React, { useState, useContext, useEffect } from "react";
import styles from "../profile/Profile.module.css";
import { FaCamera } from "react-icons/fa";
import axios from "axios";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Navbar from "../navbar/Navbar";

const Profile = () => {
  const navigate = useNavigate()
  const { credentials, setcredentials } = useContext(UserContext);

  const [formData, setFormData] = useState({
    firstname: credentials?.firstname || "",
    lastname: credentials?.lastname || "",
    email: credentials?.email || "",
    profileimage: null,
  });

  const [preview, setPreview] = useState(
    credentials?.profileImg || "https://via.placeholder.com/150"
  );


  useEffect(() => {
    if (credentials) {
      setFormData({
        firstname: credentials.firstname || "",
        lastname: credentials.lastname || "",
        email: credentials.email || "",
        profileimage: null,
      });

      // ✅ Handle Cloudinary or local profile image
      if (credentials.profileImg) {
        if (credentials.profileImg.startsWith("http")) {
          // Cloudinary or external URL
          setPreview(
            credentials.profileImg.replace("/upload/", "/upload/w_200,h_200,c_fill,q_auto/")
          );
        } else {
          // old local image fallback
          const fixedPath = credentials.profileImg.replace(/\\/g, "/").replace(/^\//, "");
          setPreview(`http://localhost:4000/${fixedPath}?t=${Date.now()}`);
        }
      } else {
        setPreview("https://via.placeholder.com/150");
      }
    }
  }, [credentials]);



  // 👇 handle file change
  function handleFileChange(e) {
    const file = e.target.files[0];
    setFormData({ ...formData, profileimage: file });
    setPreview(URL.createObjectURL(file)); // temporary preview
  }

  // 👇 handle text input change
  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  // 👇 update profile handler
  async function handleUpdate(e) {
    e.preventDefault();

    const data = new FormData();
    data.append("firstname", formData.firstname);
    data.append("lastname", formData.lastname);
    data.append("email", formData.email);
    if (formData.profileimage) {
      data.append("profileimage", formData.profileimage);
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(
        `https://circle-social-media-backend.onrender.com/user/updateprofile`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        navigate('/home')
        setcredentials(response.data.updatedUser);
        // localStorage.setItem("user", JSON.stringify(response.data.user)); // persist
      }
    }
    catch (err) {
      const message =
        err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(message);
      console.error("Profile update error:", message);
    }
  }

  return (
    <>

      <Navbar />
      <div className={styles.profileContainer}>
        <form className={styles.card} onSubmit={handleUpdate}>
          <div className={styles.imageWrapper}>
            <img src={preview} alt="Profile" className={styles.profileImg} />

            <label htmlFor="fileInput" className={styles.cameraIcon}>
              <FaCamera />
            </label>
            <input
              type="file"
              id="fileInput"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          <input
            type="text"
            name="firstname"
            placeholder="First Name"
            className={styles.inputField}
            value={formData.firstname}
            onChange={handleChange}
          // required
          />

          <input
            type="text"
            name="lastname"
            placeholder="Last Name"
            className={styles.inputField}
            value={formData.lastname}
            onChange={handleChange}
          // required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className={styles.inputField}
            value={formData.email}
            readOnly
            onChange={handleChange}
            required
          />

          <button type="submit" className={styles.saveBtn}>
            Update Profile
          </button>
        </form>
      </div>
    </>
  );
};

export default Profile;
