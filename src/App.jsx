import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './component/signup/SignUp'
import SignIn from './component/signin/SignIn'
import Home from './component/home/Home'
import Navbar from './component/navbar/Navbar'
import Profile from './component/profile/Profile'
import AddPost from './component/addpost/Addpost'
import ProtectedRoute from './routes/protectedRoute/ProtectedRoute'
import PublicRoute from './routes/publicRoute/PublicRoute'
import MyPost  from './component/myposts/Mypost'


// 🔹 React Toastify imports
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditModal from './component/modal/editModal/EditModal'



const App = () => {
  return (
    <>
      {/* 🔹 ToastContainer ek hi dafa global level par add karo */}
      <ToastContainer
        position="top-right"
        autoClose={3000}  // 3 sec me close
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"  // options: "light", "dark", "colored"
      />
      <BrowserRouter>
        <Routes>
          <Route path='/signup' element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } />
          <Route path='/' element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>

          } />

          <Route path='/home' element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path='/mypost' element={
            <ProtectedRoute>
              <MyPost />
            </ProtectedRoute>
          } />
          <Route path='/navbar' element={
            <ProtectedRoute>
              <Navbar />
            </ProtectedRoute>
          } />

          <Route path='/profile' element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path='/addpost' element={
            <ProtectedRoute>
              <AddPost />
            </ProtectedRoute>
          } />
          <Route path='/editmodal' element={
            <ProtectedRoute>
              <EditModal />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>


    </>
  )
}

export default App