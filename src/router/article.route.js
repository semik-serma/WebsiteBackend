import express from "express";
import { uploadImage } from "../utils/cloudinary.js";
import {
  createArticle,
  getArticles,
  updateArticle,
  deleteArticle,
  getarticlebyid,
  likeArticle,
  shareArticle,
} from "../controller/article.controller.js";

const Articleroute = express.Router();

Articleroute.post("/create", uploadImage.single("image"), createArticle);
Articleroute.get("/displayarticle", getArticles);
Articleroute.get('/display/:id', getarticlebyid);
Articleroute.put("/update/:id", uploadImage.single("image"), updateArticle);
Articleroute.delete("/delete/:id", deleteArticle);
Articleroute.post("/like/:id", likeArticle);
Articleroute.post("/share/:id", shareArticle);

export default Articleroute;
