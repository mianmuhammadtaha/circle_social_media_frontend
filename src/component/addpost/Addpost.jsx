import React, { useState, useRef } from "react";
import axios from "axios";
import { FaCamera } from "react-icons/fa";
import { toast } from "react-toastify"; // ✅ import toast
// import "react-toastify/dist/ReactToastify.css"; // ✅ css import
import styles from "../addpost/Addpost.module.css";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import Navbar from "../navbar/Navbar";


const AddPost = () => {
    const { ispost, setispost } = useContext(UserContext)

    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        description: "",
        hashtag: "",
        filepath: null,
    });

    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    // Handle input change
    const handleChange = (e) => {
        if (e.target.name === "filepath") {
            const file = e.target.files[0];
            setFormData({ ...formData, filepath: file });

            if (file) {
                setPreview(URL.createObjectURL(file)); // ✅ image preview
            }
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleFileClick = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append("description", formData.description);
            data.append("hashtag", formData.hashtag);
            data.append("postimage", formData.filepath);

            const token = localStorage.getItem("token");

            const res = await axios.post("https://circle-social-media-backend.onrender.com/user/addpost", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${token}`,
                },
            });

            // ✅ toaster success
            if (res.data.message) {
                toast.success(res.data.message);
                navigate('/home')
                setispost(!ispost)
            }

            setFormData({ description: "", hashtag: "", filepath: null });
            setPreview(null);
        } catch (error) {
            // ✅ toaster error
            toast.error(error.response?.data?.message || "❌ Failed to create post!");
        }
    };

    return (
        <>
            <Navbar />
            <div className={styles.container}>
                <h2 className={styles.title}>Create New Post</h2>
                <form onSubmit={handleSubmit}>
                    {/* Upload Circle with Camera */}
                    <div className={styles.uploadCircle} onClick={handleFileClick}>
                        {preview ? (
                            <img src={preview} alt="Preview" className={styles.previewImg} />
                        ) : (
                            <FaCamera className={styles.cameraIcon} />
                        )}
                    </div>

                    {/* Hidden file input */}
                    <input
                        type="file"
                        name="filepath"
                        ref={fileInputRef}
                        onChange={handleChange}
                        className={styles.hiddenInput}
                        accept="image/*"
                    />

                    {/* Description */}
                    <label className={styles.label}>Description:</label>
                    <textarea
                        name="description"
                        className={styles.textarea}
                        value={formData.description}
                        onChange={handleChange}
                        
                    />

                    {/* Hashtag */}
                    <label className={styles.label}>Hashtag:</label>
                    <input
                        type="text"
                        name="hashtag"
                        className={styles.input}
                        value={formData.hashtag}
                        onChange={handleChange}
                        placeholder="#mern"
                        
                    />

                    {/* Submit */}
                    <button type="submit" className={styles.button}>
                        Add Post
                    </button>
                </form>
            </div>
        </>

    );
};

export default AddPost;
