import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../signup/SignUp.module.css'; // 👈 CSS Module
import { toast } from "react-toastify"; // ✅ import toast

import axios from 'axios'
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';


const SignUp = () => {
    const { setcredentials } = useContext(UserContext)
    const navigate = useNavigate();

    const [formdata, setFormdata] = useState({
        firstname: "",
        lastname: "",
        email: "",
        dob: "",
        gender: "",
        password: "",
        confirmpassword: ""
    });

    function handle_change(e) {
        setFormdata({ ...formdata, [e.target.name]: e.target.value })
    }

    async function handle_submit(e) {
        e.preventDefault();
        try {
            setcredentials({
                firstname: formdata.firstname,
                lastname: formdata.lastname,
                email: formdata.email,
                dob: formdata.dob,
                gender: formdata.gender,
                password : formdata.password
            })
            const response = await axios.post('https://circle-social-media-backend.onrender.com/user/signup', formdata);
            const res = response.data;

            if (res.success) {
                toast.success(res.message);
                navigate('/');
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        }
    }




    return (
        <div className={styles.main}>
            <div className={styles.signupContainer}>


                <div className={styles.leftSection}>
                    <h1 className={styles.logo}>Circle</h1>
                    <p className={styles.tagline}>
                        Connect with friends and the world around you on Circle.
                    </p>
                </div>

                <div className={styles.rightSection}>
                    <div className={styles.signupBox}>
                        <h2>Create a new account</h2>
                        <p>It’s quick and easy.</p>

                        <form className={styles.signupForm} onSubmit={handle_submit}>
                            <div className={styles.nameFields}>
                                <input
                                    type="text"
                                    placeholder="First name"
                                    name='firstname'
                                    required
                                    className={styles.halfInput}
                                    onChange={(e) => {
                                        handle_change(e)
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Last name"
                                    name='lastname'
                                    required
                                    className={styles.halfInput}
                                    onChange={(e) => {
                                        handle_change(e)
                                    }}
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Email address"
                                name='email'
                                required
                                className={styles.fullInput}
                                onChange={(e) => {
                                    handle_change(e)
                                }}
                            />

                            <label>Date of birth</label>
                            <input
                                type="date"
                                // value={dob}
                                name='dob'
                                required
                                className={styles.fullInput}
                                onChange={(e) => {
                                    handle_change(e)
                                }}
                            />

                            <label>Gender</label>
                            <div className={styles.genderFields}>
                                <label>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Female"
                                        // checked={gender === "Female"}
                                        onChange={(e) => {
                                            handle_change(e)
                                        }}
                                    /> Female
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Male"
                                        // checked={gender === "Male"}
                                        onChange={(e) => {
                                            handle_change(e)
                                        }}
                                    /> Male
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="Custom"
                                        // checked={gender === "Custom"}
                                        onChange={(e) => {
                                            handle_change(e)
                                        }}
                                    /> Custom
                                </label>
                            </div>

                            <input
                                type="password"
                                placeholder="New password"
                                name='password'
                                required
                                className={styles.fullInput}
                                // value={password}
                                onChange={(e) => {
                                    handle_change(e)
                                }}
                            />

                            <input
                                type="password"
                                placeholder="Confirm password"
                                name='confirmpassword'
                                required
                                className={styles.fullInput}
                                // value={confirmPassword}
                                onChange={(e) => {
                                    handle_change(e)
                                }}
                            />

                            <button className={styles.signupButton} type="submit">
                                Sign Up
                            </button>
                        </form>

                        <div className={styles.accountRedirect}>
                            <p>
                                Already have an account?{" "}
                                <Link to="/" className={styles.loginLink}>
                                    Log In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SignUp;
