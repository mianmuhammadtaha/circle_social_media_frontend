import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../signin/SignIn.module.css'; // 👈 CSS Module
import axios from 'axios';

import { toast } from 'react-toastify'
import { UserContext } from '../../context/UserContext';


const SignIn = () => {

    const { credentials, setcredentials } = useContext(UserContext)
    // useEffect(() => {
    //     console.log("Updated credentials:", credentials);
    // }, [credentials]);

    const navigate = useNavigate()

    const [formdata, setFormData] = useState({
        email: "",
        password: ""
    })

    function handle_Onchange(e) {
        setFormData({ ...formdata, [e.target.name]: e.target.value })
    }

    async function handle_Submit(e) {
        e.preventDefault();

        try {
            // console.log("1")
            const response = await axios.post('https://circle-social-media-backend.onrender.com/user/signin', formdata);
            // console.log("2")

            if (response.data.success) {
                toast.success(response.data.message);
                console.log(response.data.isUser)
                setcredentials(response.data.isUser)
                // console.log(credentials)

                localStorage.setItem("token", response.data.token);
                // console.log("4")
                navigate("/home");
            } else {
                // console.log("5")
                toast.error(response.data.message);
            }
            // console.log("6")

        }
        catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error("Something went wrong. Please try again.");
            }
        }
    }


    return (
        <div className={styles.main}>
            <div className={styles.loginContainer}>

                <div className={styles.leftSection}>
                    <h1 className={styles.logo}>Circle</h1>
                    <p className={styles.tagline}>
                        Connect with friends and the world around you on Circle.
                    </p>
                </div>

                <div className={styles.rightSection}>
                    <div className={styles.loginBox}>
                        <form className={styles.loginForm} onSubmit={handle_Submit}>
                            <input
                                type="text"
                                placeholder="Email address"
                                name='email'
                                onChange={(e) => {
                                    handle_Onchange(e)
                                }}
                                className={styles.fullInput}
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                name='password'
                                onChange={(e) => {
                                    handle_Onchange(e)
                                }}
                                className={styles.fullInput}
                                required
                            />

                            <button type="submit" className={styles.loginButton}>
                                Log In
                            </button>


                            <div className={styles.divider}></div>

                            <Link to="/signup">
                                <button type="button" className={styles.signupRedirect}>
                                    Create New Account
                                </button>
                            </Link>
                        </form>

                        <div className={styles.accountRedirect}>
                            <p>
                                Don’t have an account?{" "}
                                <Link to="/signup" className={styles.signupLink}>
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SignIn;
