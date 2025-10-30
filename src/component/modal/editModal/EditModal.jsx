import React, { useState, useRef, useEffect } from "react";
import style from "../editModal/EditModal.module.css"
import Modal from "react-modal"
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup';
import axios from 'axios'
import { toast } from 'react-toastify'
import { FaCamera } from "react-icons/fa"; // ✅ added camera icon for circular upload


Modal.setAppElement("#root") // jis ma hammara app component render ho raha hai 
// modal ko batana hia ka background content hammara app component hai tu us ko blur karna hai render k waqat
// #root → tumhara main React app ka div hai (jisme App.js render hota hai)
// Modal.setAppElement("#root") → React Modal ko batata hai ke background content ye hai, jise modal open hone par aria-hidden kar do (so that keyboard aur screen readers us part tak na ja sakein)


// ✅ Validation schema
const editPostSchema = Yup.object().shape({
    description: Yup.string()
        .min(5, "Description is too short")
        // .required("Description is required"),
    // hashtag: Yup.string().required("Hashtag is required"),
});

const EditModal = ({ isOpen, onClose, postData, fetchPosts }) => {
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    // ✅ Added console.log to verify postData structure
    useEffect(() => {
        console.log("Post Data received in EditModal:", postData);
    }, [postData]);

    // ✅ Load post data (image + text) whenever modal opens
    // ✅ FIX: useEffect ensures this runs only when postData changes
    useEffect(() => {
        if (postData && postData.filepath) {
            let imageUrl;
            if (postData.filepath.startsWith("http")) {
                imageUrl = postData.filepath;
            } else {
                imageUrl = `https://circle-social-media-backend.onrender.com/${postData.filepath.replace(/\\/g, "/")}`;
            }
            setPreviewImage(imageUrl);
        } else {
            setPreviewImage(null);
        }
    }, [postData]); // ✅ Only re-run when postData changes



    // ✅ Handle Image Selection
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewImage(URL.createObjectURL(file)); // Show new preview immediately
        }
    };

    // ✅ Open file input when image circle is clicked
    const handleFileClick = () => {
        fileInputRef.current.click();
    };

    // ✅ Submit Function
    const handleSubmit = async (values) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("description", values.description);
            formData.append("hashtag", values.hashtag);
            if (imageFile) {
                formData.append("image", imageFile);
            }

            await axios.put(
                `https://circle-social-media-backend.onrender.com/api/posts/${postData._id}`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            toast.success("✅ Post updated successfully!");
            onClose();
            fetchPosts();
        } catch (error) {
            console.error(error);
            toast.error("❌ Failed to update post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onClose}
            className={style.modalContent}
            overlayClassName={style.modalOverlay}
        >
            <h2 className={style.heading}>Edit Post</h2>

            {/* ✅ Don’t render Formik until postData is available */}
            {!postData ? (
                <p className={style.loadingText}>Loading post data...</p>
            ) : (
                <Formik
                    initialValues={{
                        description: postData.description || "",
                        hashtag: postData.hashtag || "",
                    }}
                    validationSchema={editPostSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize // ✅ ensures values update when postData changes
                >
                    {({ isSubmitting }) => (
                        <Form className={style.form}>
                            {/* 🖼️ Circular Image Preview on top */}
                            <div className={style.uploadCircle} onClick={handleFileClick}>
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        className={style.previewImg}
                                    />
                                ) : (
                                    <FaCamera className={style.cameraIcon} />
                                )}
                            </div>

                            {/* Hidden file input */}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                className={style.hiddenInput}
                            />

                            {/* 📝 Description */}
                            <div className={style.field}>
                                <label className={style.label}>Description</label>
                                <Field
                                    as="textarea"
                                    name="description"
                                    className={style.textarea}
                                    rows="3"
                                />
                                <ErrorMessage
                                    name="description"
                                    component="div"
                                    className={style.error}
                                />
                            </div>

                            {/* 🏷️ Hashtag */}
                            <div className={style.field}>
                                <label className={style.label}>Hashtag</label>
                                <Field
                                    name="hashtag"
                                    className={style.input}
                                    placeholder="#example"
                                />
                                <ErrorMessage
                                    name="hashtag"
                                    component="div"
                                    className={style.error}
                                />
                            </div>

                            {/* Buttons */}
                            <div className={style.btns}>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || loading}
                                    className={style.saveBtn}
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={style.cancelBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            )}
        </Modal>
    );
};

export default EditModal;