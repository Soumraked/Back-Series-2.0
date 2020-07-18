const express = require("express");
const app = express.Router();

var config = {
  apiKey: "AIzaSyCa7ENlfzLVUYaTMIn2toYGiO_APRZWq4U",
  authDomain: "koonga.firebaseapp.com",
  databaseURL: "https://koonga.firebaseio.com",
  projectId: "koonga",
  storageBucket: "koonga.appspot.com",
  messagingSenderId: "22106575258",
  appId: "1:22106575258:web:476db1761d312332232a23",
  measurementId: "G-TP69EP3QE8",
};

const { admin, db, AuthAdmin } = require("../utils/init");

app.post("/upload/:folder/:name", AuthAdmin, (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${req.params.name}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        destination: `${req.params.folder}/${imageFileName}`,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${req.params.folder}%2F${imageFileName}?alt=media`;
        db.doc(`/series/${req.params.folder}`)
          .get()
          .then((doc) => {
            if (doc.exists) {
              let image = {};
              image[req.params.name] = imageUrl;
              db.doc(`/series/${req.params.folder}`).update(image);
              return res.status(200).json({ message: "Image save" });
            } else {
              return res
                .status(200)
                .json({ message: "Don't save image un db.", url: imageUrl });
            }
          });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ error: err.code });
      });
  });
  busboy.end(req.rawBody);
});

module.exports = app;
