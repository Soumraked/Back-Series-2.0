//Cloud Functions
const { functions } = require("./utils/init");

//imports
const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const app = express();

//uses
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

//Routes
app.use("/auth", require("./routes/auth"));
app.use("/image", require("./routes/image"));
app.use("/serie", require("./routes/serie"));
app.use("/chapter", require("./routes/chapter"));
app.use("/last", require("./routes/last"));
app.use("/report", require("./routes/report"));
app.use("/getApi", require("./routes/getApi"));

//export
exports.api = functions.https.onRequest(app);
