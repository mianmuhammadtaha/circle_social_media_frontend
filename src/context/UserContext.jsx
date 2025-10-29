import { useEffect, useState } from "react";
import { createContext } from "react";
import axios from "axios"
import { jwtDecode } from "jwt-decode";

import io from 'socket.io-client';


export const UserContext = createContext()

export const UserProvider = ({ children }) => {
    const [ispost, setispost] = useState(false);
    const [followers, setFollowers] = useState([])
    const [following, setFollowing] = useState([])
    const [credentials, setcredentials] = useState({
        firstname: "",
        lastname: "",
        email: "",
        dob: "",
        gender: "",
        password: ""
    })

    const [followstatus, setFollowStatus] = useState({})
    const [isfollow, setIsFollow] = useState(false)
    const [contextUser_Id, setContextUser_Id] = useState(null)
    const [socket, setSocket] = useState(null);


    const [socketReady, setSocketReady] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                setContextUser_Id(userId);

                const s = io("https://circle-social-media-backend.onrender.com");

                s.on("connect", () => {
                    console.log("Socket connected!", s.id);
                    s.emit("join_room", userId); // now safely join the room
                    setSocket(s);
                    setSocketReady(true);
                });



                return () => s.disconnect();
            } catch (err) {
                console.error("JWT decode failed:", err.message);
                localStorage.removeItem("token");
            }
        }
    }, []);




    async function handleFollow(targetUser) {
        const token = localStorage.getItem("token")

        try {
            // console.log("1")
            const response = await axios.post("https://circle-social-media-backend.onrender.com/user/follow",
                { targetUser },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            // console.log("2")
            const newStatus = response.data?.status;

            setFollowStatus(prev => ({
                ...prev,
                [targetUser]: newStatus
            }));
        }
        catch (err) {
            console.log("handleFollow error ----", err.message)
        }
    }


    async function getallfollowing() {
        const token = localStorage.getItem('token')
        try {
            const response = await axios.get("https://circle-social-media-backend.onrender.com/user/getallfollowing",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
            const data = response.data.data

            const followmap = {};
            data.forEach((element) => {
                followmap[element.targetUser] = element.status;
            })
            setFollowStatus(prev => ({ ...prev, ...followmap }));
            console.log("All following -----------", data)
        }
        catch (err) {
            console.log("getallfollowing error ------", err.message)
        }

    }



    useEffect(() => {

        // getallfollowers()
        getallfollowing()
    }, [])

    useEffect(() => {
        if (isfollow) getallfollowing(); // refetch after follow/unfollow
    }, [isfollow])


    return (
        <UserContext.Provider value={{
            ispost,
            setispost,
            credentials,
            setcredentials,
            followers,
            setFollowers,
            following,
            setFollowing,
            setIsFollow,
            isfollow,
            handleFollow,
            // getallfollowers,
            getallfollowing,
            followstatus,
            setFollowStatus,
            setContextUser_Id,
            contextUser_Id,
            socket,
            socketReady
        }}>
            {children}
        </UserContext.Provider >
    )
}