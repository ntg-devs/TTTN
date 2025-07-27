import React from "react";
import "./css/App.css";
import Header from "./container/Header/Header";
import Footer from "./container/Footer/Footer";
import HomePage from "./container/Home/HomePage";
import ShopPage from "./container/Shop/ShopPage";
import DetailProductPage from "./container/DetailProduct/DetailProductPage";
import ShopCartPage from "./container/ShopCart/ShopCartPage";
import BlogPage from "./container/Blog/BlogPage";
import DetailBlog from "./container/Blog/DetailBlog";
import HomePageAdmin from "./container/System/HomePageAdmin";
import { ToastContainer } from "react-toastify";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router";
import VerifyEmail from "./container/System/Email/VerifyEmail";
import LoginWebPage from "./container/Login/LoginWebPage";
import UserHomePage from "./container/User/UseHomePage";
import VoucherHomePage from "./container/Voucher/VoucherHomePage";
import OrderHomePage from "./container/Order/OrderHomePage";
import TopMenu from "./container/Header/TopMenu";
import PaymentSuccess from "./container/User/PaymentSuccess";
import VnpayPaymentPage from "./container/Order/VnpayPaymentPage";
import VnpayPaymentSuccess from "./container/Order/VnpayPaymentSuccess";
import KolRegistrationForm from "./container/User/KOL/KolRegistrationForm";
import KolDashboard from "./container/User/KOL/KolDashboard";
import KolApplicationStatus from "./container/User/KOL/KolApplicationStatus";
import AffiliateRedirect from "./container/Affiliate/AffiliateRedirect";

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route
                    path="/"
                    element={
                        <>
                            <Header />
                            <HomePage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/shop"
                    element={
                        <>
                            <Header />
                            <ShopPage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/detail-product/:id"
                    element={
                        <>
                            <Header />
                            <DetailProductPage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/shopcart"
                    element={
                        <>
                            <Header />
                            <ShopCartPage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/payment/success"
                    element={
                        <>
                            <Header />
                            <PaymentSuccess />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/payment/vnpay"
                    element={
                        <>
                            <TopMenu />
                            <VnpayPaymentPage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/payment/vnpay_return"
                    element={
                        <>
                            <TopMenu />
                            <VnpayPaymentSuccess />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/login"
                    element={
                        <>
                            <Header />
                            <LoginWebPage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/voucher"
                    element={
                        <>
                            <Header />
                            <VoucherHomePage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/blog"
                    element={
                        <>
                            <Header />
                            <BlogPage />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/blog-detail/:id"
                    element={
                        <>
                            <Header />
                            <DetailBlog />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/about"
                    element={
                        <>
                            <Header />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/verify-email"
                    element={
                        <>
                            <Header />
                            <VerifyEmail />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="kol-registration/:id"
                    element={<KolRegistrationForm />}
                />
                <Route
                    path="/user/kol/dashboard"
                    element={
                        <>
                            <Header />
                            <KolDashboard />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/user/kol/status/:userId"
                    element={
                        <>
                            <Header />
                            <KolApplicationStatus />
                            <Footer />
                        </>
                    }
                />
                <Route
                    path="/a/:shortCode"
                    element={
                        <AffiliateRedirect />
                    }
                />

                {/* Protected Routes */}
                <Route
                    path="/admin/*"
                    element={
                        JSON.parse(localStorage.getItem("userData")) &&
                        (JSON.parse(localStorage.getItem("userData")).roleId ===
                            "R1" ||
                            JSON.parse(localStorage.getItem("userData"))
                                .roleId === "R4") ? (
                            <HomePageAdmin />
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/user/*"
                    element={
                        JSON.parse(localStorage.getItem("userData")) ? (
                            <>
                                <Header />
                                <UserHomePage />
                                <Footer />
                            </>
                        ) : (
                            <Navigate to="/login" />
                        )
                    }
                />
                <Route
                    path="/order/:userId"
                    element={
                        <>
                            <TopMenu />
                            <OrderHomePage />
                            <Footer />
                        </>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;
