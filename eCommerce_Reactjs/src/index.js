import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from "./store/store";
import { ToastContainer } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
    <React.StrictMode>
        <Provider store={store}>
            <App />
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
            />
        </Provider>
    </React.StrictMode>
);

reportWebVitals();
