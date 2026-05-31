const express = require("express");

const router = express.Router();

const favoriteController = require(
  "./favorites.controller"
);

router.get(
  "/",
  favoriteController.getFavorites
);

router.get(
  "/check",
  favoriteController.checkFavorite
);

router.post(
  "/",
  favoriteController.addFavorite
);

router.delete(
  "/:id",
  favoriteController.removeFavoriteById
);

router.delete(
  "/",
  favoriteController.removeFavorite
);

module.exports = router;