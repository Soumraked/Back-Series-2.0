const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

const firebase = require("firebase");
const firebaseConfig = {
  apiKey: "AIzaSyCa7ENlfzLVUYaTMIn2toYGiO_APRZWq4U",
  authDomain: "koonga.firebaseapp.com",
  databaseURL: "https://koonga.firebaseio.com",
  projectId: "koonga",
  storageBucket: "koonga.appspot.com",
  messagingSenderId: "22106575258",
  appId: "1:22106575258:web:476db1761d312332232a23",
  measurementId: "G-TP69EP3QE8",
};
firebase.initializeApp(firebaseConfig);

const AuthAdmin = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .where("rol", "==", "admin")
        .limit(1)
        .get();
    })
    .then((data) => {
      if (data._size === 0) {
        return res.status(400).json({ error: "Unauthorized" });
      }
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch((err) => {
      if (err.code === "auth/id-token-expired") {
        const jwtDecode = require("jwt-decode");
        const decoded = jwtDecode(idToken);
        req.user = decoded;
        return db
          .collection("users")
          .where("userId", "==", decoded.user_id)
          .where("rol", "==", "admin")
          .limit(1)
          .get()
          .then((data) => {
            if (data._size === 0) {
              return res.status(400).json({ error: "Unauthorized" });
            }
            req.user.handle = data.docs[0].data().handle;
            return next();
          })
          .catch((err) => {
            return res.status(400).json(err);
          });
      } else {
        return res.status(400).json(err);
      }
    });
};

module.exports = { admin, db, functions, firebase, AuthAdmin };
