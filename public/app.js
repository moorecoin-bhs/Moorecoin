import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

const config = {
  apiKey: "AIzaSyDnizZUXNy3NgqJJIP3IHaSgFuu7HIc-a4",
  authDomain: "mooreco-in.firebaseapp.com",
  projectId: "mooreco-in",
  storageBucket: "mooreco-in.firebasestorage.app",
  messagingSenderId: "364134655350",
  appId: "1:364134655350:web:a0e42b5a8f13c935e28657",
  measurementId: "G-RKP99CRTSM",
};

export const app = initializeApp(config);
export const apiBase =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "https://api.mooreco.in";

// er eq
// f\left(t\right)=\max\left(0.005,1.2\cdot e^{-.000521t}\right)
// Math.max(0.005, 1.2 * Math.exp(-0.000521 * t))

export const calculateExchangeRate = (t) => {
  return Math.max(0.005, 1.2 * Math.exp(-0.000521 * t));
};

// ir eq
// g\left(t\right)=.1+.65\cdot e^{-.000486t}
// .1 + .65 * Math.exp(-0.000486 * t)

export const calculateInterestRate = (t) => {
  return 0.1 + 0.65 * Math.exp(-0.000486 * t);
};
