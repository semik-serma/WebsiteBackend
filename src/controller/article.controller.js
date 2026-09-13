import { Article } from "../models/articleModels.js";
import { successResponse } from "../utils/response.js";


export const createArticle = async (req, res) => {
  try {
    const { title, content, author } = req.body
    

    // Validate
    if (!title || !content || !author) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }
    console.log(req.file)
    const article = await Article.create({
      title,
      content,
      author,
      image: req.file.path
    });

    res.status(201).json({
      success: true,
      message: "Article created",
      article
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getArticles = async (req, res) => {
  try {
    const articles = await Article.find()

    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getarticlebyid=async(req,res)=>{
    try {
        const id=req.params.id
        const articlesbyid=await Article.findById(id)
        if (!articlesbyid) {
            return res.status(404).json({ message: "Article not found" });
        }
        successResponse(res,'successfully fetched articlesbyid',articlesbyid)
    } catch (error) {
        console.log('error at getarticlesbyid:', error.message)
        res.status(400).json({ message: "Invalid Article ID or error fetching article" })
    }
}



export const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const updateArticle = async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    article.title = title || article.title;
    article.content = content || article.content;
    article.author = author || article.author;

    // If new image uploaded → replace
    if (req.file) {
      article.image = req.file.path; // new Cloudinary URL
    }

    await article.save();

    res.json({
      success: true,
      message: "Article updated",
      article
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================= DELETE ARTICLE =================
export const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    await article.deleteOne();

    res.json({
      success: true,
      message: "Article deleted"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= LIKE ARTICLE =================
export const likeArticle = async (req, res) => {
  try {
    const { userEmail } = req.body;
    const identifier = userEmail || req.user?.email || req.ip;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    const likes = Array.isArray(article.likes) ? article.likes : [];
    const hasLiked = likes.includes(identifier);
    let updated;
    if (hasLiked) {
      updated = await Article.findByIdAndUpdate(
        req.params.id,
        { $pull: { likes: identifier } },
        { new: true }
      );
    } else {
      updated = await Article.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { likes: identifier } },
        { new: true }
      );
    }
    const updatedLikes = (updated && updated.likes) ? updated.likes : [];
    res.json({
      success: true,
      hasLiked: !hasLiked,
      likesCount: updatedLikes.length,
      likes: updatedLikes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= SHARE ARTICLE =================
export const shareArticle = async (req, res) => {
  try {
    const updated = await Article.findByIdAndUpdate(
      req.params.id,
      { $inc: { sharesCount: 1 } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json({
      success: true,
      sharesCount: updated.sharesCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

