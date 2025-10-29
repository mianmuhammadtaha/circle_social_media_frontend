import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../navbar/Navbar.module.css";
import { FaBars, FaBell, FaCog, FaPlus, FaClipboardList } from "react-icons/fa";
import { UserContext } from "../../context/UserContext";
import axios from "axios";

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [requests, setRequests] = useState([]);

  const { credentials, setcredentials } = useContext(UserContext);

  // Fetch user credentials
  useEffect(() => {
    async function getUserdata() {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("https://circle-social-media-backend.onrender.com/user/getUserData", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setcredentials(response.data.user);
      } catch (err) {
        console.log("User data fetch error:", err.message);
      }
    }
    getUserdata();
  }, []);

  // Fetch follow requests
  async function getAllFollowers() {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("https://circle-social-media-backend.onrender.com/user/getallfollowers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.data || []);
    } catch (err) {
      console.log("getAllFollowers error:", err.message);
    }
  }

  useEffect(() => {
    if (showNotifications) getAllFollowers();
  }, [showNotifications]);

  // Accept / Reject follow requests
  async function handleRequestAction(followCollection_id, action, method) {
    const token = localStorage.getItem("token");
    try {
      let res;
      if (method === "delete") {
        res = await axios.delete(`https://circle-social-media-backend.onrender.com/user/${action}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { followCollection_id },
        });
      } else if (method === "patch") {
        res = await axios.patch(
          `https://circle-social-media-backend.onrender.com/user/${action}`,
          { followCollection_id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      if (res.data.success) {
        setRequests((prev) => prev.filter((r) => r._id !== followCollection_id));
      }
    } catch (err) {
      console.log(`${action} error:`, err.message);
    }
  }

  // Build profile image
  let profileImg = "https://via.placeholder.com/40";
  if (credentials?.profileImg) {
    if (credentials.profileImg.startsWith("http")) {
      profileImg = credentials.profileImg.replace("/upload/", "/upload/w_60,h_60,c_fill,q_auto/");
    } else {
      const fixedPath = credentials.profileImg.replace(/\\/g, "/").replace(/^\//, "");
      profileImg = `http://localhost:4000/${fixedPath}?t=${Date.now()}`;
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <header className={styles.navbar}>
      {/* Left - Logo */}
      <div className={styles.leftNav}>
        <h2 className={styles.logo}>
          <Link to="/">Circle</Link>
        </h2>
      </div>

      {/* Center - Search */}
      <div className={styles.centerNav}>
        <input type="text" placeholder="Search Circle..." className={styles.searchBox} />
      </div>

      {/* Right - Icons */}
      <div className={styles.rightNav}>
        {/* Add Post */}
        <Link to="/addpost" className={styles.iconLink} data-tooltip="Add Post">
          <FaPlus />
        </Link>

        {/* My Posts */}
        <Link to="/mypost" className={styles.iconLink} data-tooltip="My Posts">
          <FaClipboardList />
        </Link>

        {/* Notifications */}
        <div className={styles.notificationWrapper}>
          <button
            className={styles.iconLink}
            data-tooltip="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
          >
            <FaBell />
            {requests.length > 0 && <span className={styles.badge}>{requests.length}</span>}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <h4>Follow Requests</h4>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <div key={req._id} className={styles.requestItem}>
                    <img
                      src={
                        req.user_id?.profileImg
                          ? req.user_id.profileImg.startsWith("http")
                            ? req.user_id.profileImg
                            : `http://localhost:4000/${req.user_id.profileImg.replace(/\\/g, "/")}`
                          : "https://via.placeholder.com/40"
                      }
                      alt="user"
                      className={styles.requestAvatar}
                    />
                    <div className={styles.requestInfo}>
                      <p>{req.user_id?.firstname} {req.user_id?.lastname}</p>
                      <div className={styles.requestButtons}>
                        <button
                          className={styles.acceptBtn}
                          onClick={() => handleRequestAction(req._id, "followaccept", "patch")}
                        >
                          Accept
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => handleRequestAction(req._id, "followdelete", "delete")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.noRequests}>No new requests</p>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className={styles.profileBox} data-tooltip="Profile">
          <img src={profileImg} alt="Profile" className={styles.profileImg} />
          <span className={styles.username}>
            {credentials?.firstname && credentials?.lastname
              ? `${credentials.firstname} ${credentials.lastname}`
              : "Guest"}
          </span>
        </div>

        {/* Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          data-tooltip="Menu"
        >
          <FaBars />
        </button>

        {menuOpen && (
          <div className={styles.dropdown}>
            <Link to="/profile" className={styles.dropdownItem}>Profile</Link>
            <Link to="/settings" className={styles.dropdownItem}>Settings</Link>
            <button className={styles.dropdownItem} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
