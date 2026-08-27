import {
  StrictMode,
} from "react";

import {
  createRoot,
} from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

import {
  WeddingProvider,
} from "./context/WeddingContext";

import "./styles/index.css";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WeddingProvider>
          <App />
        </WeddingProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);