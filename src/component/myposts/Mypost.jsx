// src/home/MyPosts.jsx
import React, { useState, useEffect, useContext } from "react";
import { useAsyncError, useNavigate } from "react-router-dom";
import styles from "../myposts/Mypost.module.css";
import Navbar from "../navbar/Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import { UserContext } from "../../context/UserContext";
import io from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import DeleteModal from "../modal/deleteModal/DeleteModal";
import EditModal from "../modal/editModal/EditModal";


const socket = io.connect("http://localhost:4000");

// helper function for "time ago"
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    year: 31536000,
    month: 2592000,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  for (const [unit, value] of Object.entries(intervals)) {
    const count = Math.floor(seconds / value);
    if (count >= 1) return `${count} ${unit}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

const MyPost = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false)
  const [modalPostId, setModalPostId] = useState(null) // jonsi post ko delete karna ho uski id bhaijo

  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [openDropdownPostId, setOpenDropdownPostId] = useState(null);


  const { ispost, setispost } = useContext(UserContext);

  const [totalLikes, setTotalLikes] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // ✅ Fetch only logged-in user's posts
  async function fetchMyPosts() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const decoded = jwtDecode(token); // ✅ extract user info
      const loggedInUserId = decoded.userId || decoded.id || decoded._id;

      const response = await axios.get("https://circle-social-media-backend.onrender.com/user/getmyposts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const myPosts = response.data?.data?.map((post) => ({
        ...post,
        isLiked: post.likes?.includes(loggedInUserId) || false, // ✅ check like
      })) || [];

      setPosts(myPosts);
    } catch (error) {
      const message = error.response?.data?.message;
      if (message === "Token Expired" || message === "Invalid Token") {
        toast.error("Session expired! Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      } else {
        toast.error(message || "Failed to load your posts!");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMyPosts();
  }, [ispost]);

  // edit or delete k dropdown ko bahir click karna par bhi band karna k liya

  useEffect(() => {
    function handleClickOutside(e) {
      setOpenDropdownPostId(null); // click anywhere closes all dropdowns
    }

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);


  // ✅ Like post (same as Home)
  async function handle_like(post_id) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://circle-social-media-backend.onrender.com/user/likepost",
        { post_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { totalLike, message } = response.data;
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post_id
            ? { ...p, likecount: totalLike, isLiked: message === "Post liked" }
            : p
        )
      );
    } catch (error) {
      const message = error.response?.data?.message;
      if (message === "Token Expired" || message === "Invalid Token") {
        toast.error("Session expired! Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      } else {
        toast.error(message || "Something went wrong!");
      }
    }
  }


  const [selectedPostId, setSelectedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 🧩 Reply states
  const [replyText, setReplyText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);

  // 🧩 Handle reply submission
  async function handlePostReply(comment_id, post_id) {
    try {
      if (!replyText.trim()) return;

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://circle-social-media-backend.onrender.com/user/postreply",
        { comment_id, message: replyText, post_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // find the comment being replied to and add reply to it
      setComments((prev) =>
        prev.map((cmt) => {
          if (cmt._id === comment_id) {
            const alreadyExists = cmt.replies?.some(
              (rep) => rep._id === response.data.reply._id
            );
            if (alreadyExists) return cmt;
            return { ...cmt, replies: [response.data.reply, ...(cmt.replies || [])] };
          }
          return cmt;
        })
      );


      setReplyText("");
      setReplyingToCommentId(null);
      toast.success("Reply added!");
    } catch (err) {
      const message = err.response?.data?.message;
      if (message === "Token Expired" || message === "Invalid Token") {
        toast.error("Session expired! Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      } else {
        toast.error(message || "Failed to add reply!");
      }
    }
  }



  async function fetchComments(post_id) {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://circle-social-media-backend.onrender.com/user/getcomment?post_id=${post_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComments(response.data.comments);
      setSelectedPostId(post_id);
    }
    catch (error) {
      const message = error.response?.data?.message;
      if (message === "Token Expired" || message === "Invalid Token") {
        toast.error("Session expired! Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      } else {
        toast.error(message || "Something went wrong!");
      }
    }

  }

  async function handlePostComment() {
    try {
      if (!newComment.trim()) return;

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://circle-social-media-backend.onrender.com/user/postcomment",
        { post_id: selectedPostId, comment: newComment },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // add new comment to list
      setComments([response.data.comment, ...comments]);
      setNewComment("");
      // setispost(!ispost)

      toast.success(response.data.message || "Comment added!");
      console.log("Comment:", response.data.comment);

    }
    catch (err) {
      const message = err.response?.data?.message;

      if (message === "Token Expired" || message === "Invalid Token") {
        toast.error("Session expired! Please login again.");
        localStorage.removeItem("token");
        navigate("/");
      } else {
        toast.error(message || "Something went wrong!");
      }
    }

  }

  useEffect(() => {
    const handleLikeCount = (data) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === data.post_id
            ? { ...post, likecount: data.totalLike }
            : post
        )
      );
    };

    const handleComment = (data) => {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post._id === data.populatedComment.post_id
            ? { ...post, commentCount: data.comment_count }
            : post
        )
      );

      if (selectedPostId === data.populatedComment.post_id) {
        setComments(prev => [data.populatedComment, ...prev]);
      }
    };

    const handleCommentReply = (data) => {
      const { post_id, comment_id, populatedReply } = data;
      if (selectedPostId === post_id) {
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment._id === comment_id) {
              const alreadyExists = comment.replies?.some(
                (rep) => rep._id === populatedReply._id
              );
              if (alreadyExists) return comment;
              return {
                ...comment,
                replies: [populatedReply, ...(comment.replies || [])],
              };
            }
            return comment;
          })
        );
      }
    };

    socket.on("like_count", handleLikeCount);
    socket.on("comment", handleComment);
    socket.on("commentreply", handleCommentReply);

    return () => {
      socket.off("like_count", handleLikeCount);
      socket.off("comment", handleComment);
      socket.off("commentreply", handleCommentReply);
    };
  }, [selectedPostId]);


  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editPostData, setEditPostData] = useState(null)

  function handleEdit(postData) {
    setEditModalOpen(true)
    setEditPostData(postData)
  }



  async function deletepost(post_id) {
    try {
      setispost(!ispost)
      const token = localStorage.getItem('token')
      const response = await axios.post("https://circle-social-media-backend.onrender.com/user/deletepost",
        { post_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const res = response.data
      console.log(res)
    }
    catch (err) {
      console.log("deletepost error -----", err.message)
    }

  }

  return (
    <div className={styles.container}>
      <Navbar />
        <section className={styles.statsCard}>
          <div className={styles.statItem}>
            <strong>{totalLikes}</strong>
            <span>Total Likes</span>
          </div>
          <div className={styles.statItem}>
            <strong>{followersCount}</strong>
            <span>Followers</span>
          </div>
          <div className={styles.statItem}>
            <strong>{followingCount}</strong>
            <span>Following</span>
          </div>
        </section>
        
      <main className={styles.main}>
        <section className={styles.feed}>
          <h2 style={{ textAlign: "center", margin: "20px 0" }}>My Posts</h2>

          {loading && <div className={styles.loader}>Loading...</div>}

          {!loading && posts.length === 0 && (
            <p style={{ textAlign: "center" }}>You haven’t created any posts yet.</p>
          )}

          {!loading &&
            posts.map((post) => (
              <div key={post._id} className={styles.postCard}>
                <div className={styles.postHeader}>
                  <img
                    src={
                      post.user_id?.profileImg
                        ? post.user_id.profileImg.startsWith("http")
                          ? post.user_id.profileImg
                          : `http://localhost:4000/${post.user_id.profileImg.replace(/\\/g, "/")}`
                        : "https://via.placeholder.com/150"
                    }
                    alt="profile"
                    className={styles.avatar}
                  />

                  <div className={styles.headerInfo}>
                    <h4>{post.user_id?.firstname} {post.user_id?.lastname}</h4>
                    <span className={styles.time}>{formatTimeAgo(post.createdAt)}</span>
                  </div>


                  <div className={styles.dropdownWrapper}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownPostId(openDropdownPostId === post._id ? null : post._id);
                      }}
                      className={styles.dotButton}
                    >
                      ⋮
                    </button>

                    {openDropdownPostId === post._id && (
                      <div
                        className={styles.dropdownMenu}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => {
                          setOpenDropdownPostId(null);
                          handleEdit(post)

                        }}>Edit</button>

                        <button onClick={() => {
                          setOpenDropdownPostId(null);
                          setModalPostId(post._id);
                          setShowModal(true)
                          console.log("delete button click-----")
                        }}>Delete</button>
                      </div>
                    )}
                  </div>

                </div>

                <p>{post.description}</p>
                <h5>{post.hashtag}</h5>

                {post.filepath && (
                  <img
                    src={
                      post.filepath.startsWith("http")
                        ? post.filepath
                        : `http://localhost:4000/${post.filepath.replace(/\\/g, "/")}`
                    }
                    alt="post"
                    className={styles.postImage}
                  />
                )}

                <div className={styles.reactionSummary}>
                  <div className={styles.leftReaction}>
                    <span className={styles.likeIcons}>👍</span>
                    <span className={styles.likeCount}>{post.likecount || 0}</span>
                  </div>
                  <div className={styles.rightReaction}>
                    <span className={styles.commentCount}>{post.commentCount || 0}</span>
                    <span className={styles.commentIcon}>💬</span>
                    <span className={styles.shareCount}>{post.shares || 0}</span>
                    <span className={styles.shareIcon}>↗️</span>
                  </div>
                </div>

                <hr className={styles.separator} />

                <div className={styles.postActions}>
                  <button
                    className={`${styles.actionBtn} ${post.isLiked ? styles.liked : ""}`}
                    onClick={() => handle_like(post._id)}
                  >
                    👍 Like
                  </button>

                  <button
                    className={styles.actionBtn}
                    onClick={() => {
                      if (activeCommentPostId === post._id) {
                        setActiveCommentPostId(null);
                      } else {
                        fetchComments(post._id);
                        setActiveCommentPostId(post._id);
                      }
                      // close dropdown if open
                      setOpenDropdownPostId(null);
                    }}
                  >
                    💬 Comment
                  </button>


                  <button className={styles.actionBtn}>↗️ Share</button>
                </div>

                {/* ✅ Comment + Reply Section */}
                {activeCommentPostId === post._id && (
                  <div className={styles.commentSection}>
                    <div className={styles.commentInput}>
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className={styles.commentBox}
                      />
                      <button onClick={handlePostComment} className={styles.commentButton}>
                        Post
                      </button>
                    </div>

                    <div className={styles.commentsListScrollable}>
                      {comments.length > 0 ? (
                        comments.map((cmt, index) => (
                          <div key={cmt._id || index} className={styles.commentItem}>

                            <img
                              src={
                                cmt.user_id?.profileImg
                                  ? cmt.user_id.profileImg.startsWith("http")
                                    ? cmt.user_id.profileImg
                                    : `http://localhost:4000/${cmt.user_id.profileImg.replace(/\\/g, "/")}`
                                  : "https://via.placeholder.com/40"
                              }
                              alt="profile"
                              className={styles.commentAvatar}
                            />

                            <div className={styles.commentContent}>
                              <div className={styles.commentHeader}>
                                <strong>{cmt.user_id?.firstname} {cmt.user_id?.lastname}</strong>
                                <span className={styles.commentTime}>• {formatTimeAgo(cmt.createdAt)}</span>
                              </div>
                              <p>{cmt.comment}</p>

                              {/* Reply button & input */}
                              <button
                                onClick={() =>
                                  setReplyingToCommentId(
                                    replyingToCommentId === cmt._id ? null : cmt._id
                                  )
                                }
                                className={styles.replyButton}
                              >
                                Reply
                              </button>

                              {replyingToCommentId === cmt._id && (
                                <div className={styles.replyInput}>
                                  <input
                                    type="text"
                                    placeholder="Write a reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    className={styles.commentBox}
                                  />
                                  <button
                                    onClick={() => handlePostReply(cmt._id, post._id)}
                                    className={styles.commentButton}
                                  >
                                    Post
                                  </button>
                                </div>
                              )}

                              {/* Show replies */}
                              {cmt.replies && cmt.replies.length > 0 && (
                                <div className={styles.repliesList}>
                                  {cmt.replies.map((rep, index) => (
                                    <div key={rep._id || `${rep.user_id?._id}-${index}`} className={styles.replyItem}>


                                      <img
                                        src={
                                          rep.user_id?.profileImg
                                            ? rep.user_id.profileImg.startsWith("http")
                                              ? rep.user_id.profileImg
                                              : `http://localhost:4000/${rep.user_id.profileImg.replace(/\\/g, "/")}`
                                            : "https://via.placeholder.com/30"
                                        }
                                        alt="reply"
                                        className={styles.commentAvatarSmall}
                                      />

                                      <div className={styles.replyContent}>
                                        <strong>{rep.user_id?.firstname} {rep.user_id?.lastname}</strong>
                                        <span className={styles.commentTime}>• {formatTimeAgo(rep.createdAt)}</span>
                                        <p>{rep.message}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No comments yet.</p>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ))}
          {showModal && (
            <DeleteModal
              isOpen={showModal}
              title="Are you sure you want to delete this post ?"
              onConfirm={async () => {
                await deletepost(modalPostId)
                setShowModal(false)
                setModalPostId(null)
              }}
              onCancel={() => {
                setModalPostId(null)
                setShowModal(false)
              }}
            />
          )}
          <EditModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            postData={editPostData}
            fetchPosts={fetchMyPosts} // ✅ so posts refresh after update
          />

        </section>
      </main>
    </div>
  );
};

export default MyPost;
