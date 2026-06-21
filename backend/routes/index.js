"use strict";

const router = require("express").Router();

router.use("/health", require("./health"));
router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/products", require("./products"));

module.exports = router;