const express = require("express");
const app = express.Router();

const { db, firebase, AuthAdmin } = require("../utils/init");

app.post("/signup", (req, res) => {
  const id = req.body.id.toString().toLowerCase();
  const password = req.body.password.toString();
  const name = req.body.id.toString();
  const rol = req.body.rol;

  let token, userId;
  db.doc(`/users/${id}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(409).json({ message: "ID is already use." });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(`${id}@kooga.tk`, password)
          .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
          })
          .then((tokenId) => {
            token = tokenId;
            const newUser = {
              id,
              name,
              rol,
              createdAt: new Date().toISOString(),
              userId: userId,
            };
            return db.doc(`/users/${newUser.id}`).set(newUser);
          })
          .then(() => {
            return res.status(200).json({ token });
          })
          .catch((error) => {
            return res.status(500).json({ error: error.code });
          });
      }
    });
});

app.post("/login", (req, res) => {
  const id = req.body.id.toString().toLowerCase();
  const password = req.body.password.toString();

  let token;
  firebase
    .auth()
    .signInWithEmailAndPassword(`${id}@kooga.tk`, password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((tokenID) => {
      token = tokenID;
      return db.collection("users").doc(id).get();
    })
    .then((doc) => {
      return res.json({
        token,
        name: doc.data().name,
        rol: doc.data().rol,
      });
    })
    .catch((error) => {
      switch (error.code) {
        case "auth/user-not-found":
          return res.status(500).json({ error: "User not found" });
        case "auth/wrong-password":
          return res.status(500).json({ error: "Wrong password" });
        case "auth/invalid-email":
          return res.status(500).json({ error: "Invalid user" });
        default:
          return res.status(500).json({ error: error.code });
      }
    });
});

app.post("/verify", AuthAdmin, (req, res) => {
  const id = req.body.id.toString().toLowerCase();
  db.doc(`/users/${id}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(200).json({ rol: doc.data().rol });
      } else {
        return res.status(400).json({ message: "Invalid User" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ error: err });
    });
});

module.exports = app;
