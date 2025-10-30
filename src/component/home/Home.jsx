// src/home/Home.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../home/Home.module.css";
import Navbar from "../navbar/Navbar";
import { useEffect } from "react";

import axios from 'axios'
import { toast } from "react-toastify";

import { useContext } from "react";
import { UserContext } from "../../context/UserContext";





// 📅 Helper: Convert timestamp to "time ago" format
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





const Home = () => {
    // mock initial posts
    const [posts, setPosts] = useState([]);
    const navigate = useNavigate()



    const { ispost, handleFollow, followstatus, setIsFollow, isfollow, contextUser_Id, socket, socketReady, setFollowStatus } = useContext(UserContext)

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
            await axios.post(
                "https://circle-social-media-backend.onrender.com/user/postreply",
                { comment_id, message: replyText, post_id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // 🟢 Just clear the input — reply will come via socket
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

    // update state declarations (unchanged)
    const [skip, setSkip] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // updated fetch_posts: accepts explicit skipIndex
    async function fetch_posts({ reset = false, skipIndex = skip } = {}) {
        if (loading) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            const response = await axios.get(
                `https://circle-social-media-backend.onrender.com/user/getpost?skip=${skipIndex}`,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );


            const newPosts = response.data?.data || []; // ✅ use backend isLiked value
            console.log(newPosts)
            if (reset) {
                setPosts(newPosts);
            } else {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p._id));
                    const filtered = newPosts.filter(p => !existingIds.has(p._id));
                    return [...prev, ...filtered];
                });
            }

            if (newPosts.length === 0) {
                setHasMore(false);
            } else {
                setSkip(skipIndex + 1);
                setHasMore(true);
            }
        } catch (err) {
            const message = err.response?.data?.message;
            if (message === "Token Expired" || message === "Invalid Token") {
                toast.error("Session expired! Please sign in again.");
                localStorage.removeItem("token");
                navigate("/");
            } else {
                toast.error(message || "Something went wrong while fetching posts!");
            }
        } finally {
            setLoading(false);
        }
    }


    useEffect(() => {
        setHasMore(true);
        setPosts([]);
        fetch_posts({ reset: true, skipIndex: 0 });
    }, [ispost]);


    useEffect(() => {
        const sentinel = document.getElementById('scroll-sentinel');
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !loading && hasMore) {
                        fetch_posts();
                    }
                });
            },
            {
                root: null,
                rootMargin: '0px 0px 300px 0px',
                threshold: 0.01,
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, [loading, hasMore, skip]);



    useEffect(() => {
        if (!socket) return; // ⚠️ Important check

        console.log("🏠 Socket listener active for selectedPostId:", selectedPostId);

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
            // console.log("💬 Received new comment:", data);

            // ✅ Update comment count on the post
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post._id === data.populatedComment.post_id
                        ? { ...post, commentCount: data.comment_count }
                        : post
                )
            );

            // ✅ If user currently has this post's comments open, show comment instantly
            if (selectedPostId === data.populatedComment.post_id) {
                setComments(prev => [data.populatedComment, ...prev]);
            }
        };

        const handleCommentReply = (data) => {
            const { post_id, comment_id, populatedReply } = data;

            if (selectedPostId === post_id) {
                setComments(prevComments =>
                    prevComments.map(comment => {
                        if (comment._id !== comment_id) return comment;

                        // 🚀 Prevent duplicate replies
                        const alreadyExists = comment.replies?.some(rep => rep._id === populatedReply._id);
                        if (alreadyExists) return comment;

                        return {
                            ...comment,
                            replies: [populatedReply, ...(comment.replies || [])],
                        };
                    })
                );
            }
        };
        const handleFollowRequest = (data) => {
            toast.info(data.message);

            if (data.senderId === contextUser_Id) {
                setFollowStatus(prev => ({
                    ...prev,
                    [data.targetUser]: "Pending" // ✅ same name as backend
                }));
            }
        };

        const handleFollowAccepted = (data) => {
            if (data.followerId === contextUser_Id) {
                toast.success(data.message);
                setFollowStatus(prev => ({
                    ...prev,
                    [data.receiverId]: "Accepted"  // ✅ correct target
                }));
            }
        };



        const handleFollowDelete = (data) => {
            toast.info(data.message);

            // Determine which side we are
            let targetUserId;
            if (data.senderId === contextUser_Id) {
                targetUserId = data.targetUser; // we sent it, it was rejected
            } else if (data.targetUser === contextUser_Id) {
                targetUserId = data.senderId; // we rejected it
            } else {
                return;
            }

            setFollowStatus(prev => ({
                ...prev,
                [targetUserId]: null
            }));
        };


        // Register listeners
        socket.on('like_count', handleLikeCount);
        socket.on('comment', handleComment);
        socket.on('commentreply', handleCommentReply)
        socket.on("follow_request", handleFollowRequest);
        socket.on("follow_accepted", handleFollowAccepted);
        socket.on("follow_deleted", handleFollowDelete);



        // Cleanup
        return () => {
            console.log("🚪 Socket listeners cleaned up for selectedPostId:", selectedPostId);
            socket.off('like_count', handleLikeCount);
            socket.off('comment', handleComment);
            socket.off("commentreply", handleCommentReply);
            socket.off("follow_request", handleFollowRequest);
            socket.off("follow_accepted", handleFollowAccepted);
            socket.off("follow_deleted", handleFollowDelete);


        };
    }, [selectedPostId, socketReady]);





    useEffect(() => {
        const container = document.querySelector(`.${styles.commentsListScrollable}`);
        if (container) container.scrollTop = 0; // new comment on top
    }, [comments]);



    async function handle_like(post_id) {
        try {
            const token = localStorage.getItem('token');

            // socket.emit("like", { post_id, token })

            const response = await axios.post(
                'https://circle-social-media-backend.onrender.com/user/likepost',
                { post_id },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const { totalLike, message } = response.data;
            console.log(response.data)

            setPosts(prevPosts =>
                prevPosts.map(p =>
                    p._id === post_id
                        ? {
                            ...p,
                            likecount: totalLike,  // direct number from backend
                            isLiked: message === "Post liked", // toggle color
                        }
                        : p
                )
            );


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


    async function getallfollowers() {
        const token = localStorage.getItem('token')
        try {
            const response = await axios.get("https://circle-social-media-backend.onrender.com/user/getallfollowers",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            const data = response.data.data
            // const decoded = jwtDecode(token); //extract user info

            console.log("All Followers -----------", data)
        }
        catch (err) {
            console.log("getallfollowers error ------", err.message)
        }

    }
    useEffect(() => {
        getallfollowers()
        console.log(":UseEffect Render--------")
    }, [])




    return (
        <div className={styles.container}>

            <Navbar />

            {/* Main layout */}
            <main className={styles.main}>
                {/* Left column: optional (e.g., shortcuts) */}
                <aside className={styles.leftColumn}>
                    {/* <div className={styles.card}>
                        <h4>Shortcuts</h4>
                        <ul className={styles.shortcutList}>
                            <li><Link to="/friends">Friends</Link></li>
                            <li><Link to="/groups">Groups</Link></li>
                            <li><Link to="/events">Events</Link></li>
                        </ul>
                    </div> */}
                </aside>

                {/* Center: feed */}
                <section className={styles.feed}>


                    {/* Feed list */}
                    <div className={styles.container}>
                        {posts.map((post) => (
                            <div key={post._id} className={styles.postCard}>

                                {/* --- Post Header --- */}
                                <div className={styles.postHeader}>
                                    <img
                                        src={
                                            post.user_id?.profileImg
                                                ? post.user_id.profileImg.startsWith("http")
                                                    ? post.user_id.profileImg
                                                    : `https://circle-social-media-backend.onrender.com/${post.user_id.profileImg.replace(/\\/g, "/")}`
                                                : "https://via.placeholder.com/150"
                                        }
                                        alt="profile"
                                        className={styles.avatar}
                                    />

                                    {/* ✅ New wrapper for name + time + follow */}
                                    <div className={styles.headerMain}>
                                        <div className={styles.headerInfo}>
                                            <h4>{post.user_id?.firstname} {post.user_id?.lastname}</h4>
                                            <span className={styles.time}>{formatTimeAgo(post.createdAt)}</span>
                                        </div>

                                        {/* ✅ Follow Button — aligned to right */}
                                        {post.user_id?._id != contextUser_Id && (
                                            <button
                                                className={`${styles.followBtn} ${followstatus[post.user_id._id] ? styles.following : ""}`}
                                                onClick={() => {
                                                    handleFollow(post.user_id?._id)
                                                }}
                                            >
                                                {followstatus[post.user_id._id] === "Pending"  // ya ma na aik mapping object banaya hia jsi ma user id k against us ka status rakhwa dia hai or phir us ki base par check ho raha hai 
                                                    ? "Requested"
                                                    : followstatus[post.user_id._id] === "Accepted"
                                                        ? "Following"
                                                        : "Follow"}
                                            </button>
                                        )}
                                    </div>
                                </div>


                                {/* --- Post Content --- */}
                                <p>{post.description}</p>
                                <h5>{post.hashtag}</h5>

                                {/* --- Post Image --- */}
                                {post.filepath && (
                                    <img
                                        src={
                                            post.filepath.startsWith("http")
                                                ? post.filepath
                                                : `https://circle-social-media-backend.onrender.com/${post.filepath.replace(/\\/g, "/")}`
                                        }
                                        alt="post"
                                        className={styles.postImage}
                                    />
                                )}


                                {/* --- Post Reactions Summary --- */}
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

                                {/* --- Post Action Buttons --- */}
                                <div className={styles.postActions}>
                                    <button
                                        className={styles.actionBtn}
                                        style={{ color: post.isLiked ? "blue" : "gray" }}
                                        onClick={() => handle_like(post._id)}
                                    >
                                        👍 Like
                                    </button>


                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => {
                                            if (selectedPostId === post._id) {
                                                setSelectedPostId(null);
                                            } else {
                                                fetchComments(post._id);
                                            }
                                        }
                                        } // 👈 load comments
                                    >
                                        💬 Comment
                                    </button>

                                    <button className={styles.actionBtn}>↗️ Share</button>
                                </div>

                                {selectedPostId === post._id && (
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
                                                comments.map((cmt) => (
                                                    <div key={cmt._id} className={styles.commentItem}>
                                                        <img
                                                            src={
                                                                cmt.user_id?.profileImg
                                                                    ? cmt.user_id.profileImg.startsWith("http")
                                                                        ? cmt.user_id.profileImg
                                                                        : `https://circle-social-media-backend.onrender.com/${cmt.user_id.profileImg.replace(/\\/g, "/")}`
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
                                                                    {cmt.replies.map((rep) => (
                                                                        <div key={rep._id} className={styles.replyItem}>
                                                                            <img
                                                                                src={
                                                                                    rep.user_id?.profileImg
                                                                                        ? rep.user_id.profileImg.startsWith("http")
                                                                                            ? rep.user_id.profileImg
                                                                                            : `https://circle-social-media-backend.onrender.com/${rep.user_id.profileImg.replace(/\\/g, "/")}`
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
                        {/* sentinel for intersection observer */}
                        <div id="scroll-sentinel" style={{ height: 1 }}></div>

                        {/* after posts list */}
                        {loading && (
                            <div className={styles.loader} role="status">
                                Loading...
                            </div>
                        )}

                        {!hasMore && !loading && posts.length > 0 && (
                            <div className={styles.endMessage}>
                                No more posts
                            </div>
                        )}

                        {!loading && posts.length === 0 && (
                            <div className={styles.emptyMessage}>
                                No posts yet.
                            </div>
                        )}

                    </div>
                </section>


                {/* Right column: suggestions / trends */}
                <aside className={styles.rightColumn}>
                    {/* <div className={styles.card}>
                        <h4>Who to follow</h4>
                        <ul className={styles.suggestions}>
                            <li>
                                <div className={styles.suggLeft}>
                                    <div className={styles.avatarSmall}>M</div>
                                    <div>
                                        <div className={styles.suggName}>Mariam</div>
                                        <div className={styles.suggMeta}>2 mutual</div>
                                    </div>
                                </div>
                                <button className={styles.followBtn}>Follow</button>
                            </li>
                            <li>
                                <div className={styles.suggLeft}>
                                    <div className={styles.avatarSmall}>R</div>
                                    <div>
                                        <div className={styles.suggName}>Raza</div>
                                        <div className={styles.suggMeta}>Developer</div>
                                    </div>
                                </div>
                                <button className={styles.followBtn}>Follow</button>
                            </li>
                        </ul>
                    </div> */}

                    {/* <div className={styles.card}>
                        <h4>Trending</h4>
                        <ol className={styles.trending}>
                            <li>#ReactTips</li>
                            <li>#Design</li>
                            <li>#Startup</li>
                        </ol>
                    </div> */}
                </aside>
            </main>
        </div>
    );
};

export default Home;
