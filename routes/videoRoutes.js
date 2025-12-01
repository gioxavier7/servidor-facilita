const express = require("express");
const router = express.Router();
const videoController = require("../controller/video/videoController");

router.post("/video", videoController.iniciarChamada);

module.exports = router;
