import { Comment } from "../models/commentModels.js";
import { successResponse } from "../utils/response.js";
import User from "../models/userModels.js";
import { AfterLoginComment } from "../models/afterlogincommentModels.js";

export const beforelogincomment = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body required"
      });
    }

    const { comment, userEmail, userName } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Comment text required"
      });
    }

    const commentData = await Comment.create({ 
      comment: comment.trim(),
      userEmail,
      userName: userName || userEmail?.split('@')[0] || 'Anonymous'
    });

    if (successResponse) {
      return successResponse(res, 'Comment created', commentData);
    } else {
      return res.status(201).json({
        success: true,
        message: "Comment created",
        data: commentData
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error creating comment",
      error: error.message
    });
  }
};

export const beforelogindisplaycomment = async (req, res) => {
  try {
    const comments = await Comment.find().sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to load comments",
      error: err.message
    });
  }
};

export const beforelogincommentgetById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comment",
      error: error.message,
    });
  }
};

export const usercommentname = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (successResponse) {
      return successResponse(res, 'User found', user);
    } else {
      return res.status(200).json({
        success: true,
        message: "User found",
        data: user
      });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error finding user",
      error: error.message
    });
  }
};

export const afterlogincomments = async (req, res) => {
  try {
    const { comment, user } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Comment text required"
      });
    }

    const created = await AfterLoginComment.create({ 
      comment: comment.trim(),
      user: user || 'Anonymous'
    });

    return res.status(201).json({
      success: true,
      message: "Comment created",
      data: created
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: "Error creating comment",
      error: error.message,
    });
  }
};

export const afterlogincommentget = async (req, res) => {
  try {
    const comments = await AfterLoginComment.find().sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

export const afterlogincommentgetById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await AfterLoginComment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }
    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comment",
      error: error.message,
    });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email required" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Toggle like
    const likedIndex = comment.likes.indexOf(userEmail);
    const dislikedIndex = comment.dislikes.indexOf(userEmail);

    if (likedIndex > -1) {
      // Already liked, remove it
      comment.likes.splice(likedIndex, 1);
    } else {
      // Add like and remove dislike if exists
      comment.likes.push(userEmail);
      if (dislikedIndex > -1) {
        comment.dislikes.splice(dislikedIndex, 1);
      }
    }

    await comment.save();
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const dislikeComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email required" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Toggle dislike
    const dislikedIndex = comment.dislikes.indexOf(userEmail);
    const likedIndex = comment.likes.indexOf(userEmail);

    if (dislikedIndex > -1) {
      // Already disliked, remove it
      comment.dislikes.splice(dislikedIndex, 1);
    } else {
      // Add dislike and remove like if exists
      comment.dislikes.push(userEmail);
      if (likedIndex > -1) {
        comment.likes.splice(likedIndex, 1);
      }
    }

    await comment.save();
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementView = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a reply to a Comment
 */
export const replyToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, userEmail, userName, userAvatar } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: "Reply text is required" });
    }

    const parentComment = await Comment.findById(id);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const newReply = {
      comment: comment.trim(),
      userEmail: userEmail || '',
      userName: userName || userEmail?.split('@')[0] || 'Anonymous',
      userAvatar: userAvatar || '',
      likes: [],
      createdAt: new Date()
    };

    parentComment.replies.push(newReply);
    await parentComment.save();

    res.status(201).json({ success: true, message: "Reply added successfully", data: parentComment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add reply", error: error.message });
  }
};

/**
 * Like/unlike a reply on a Comment
 */
export const likeCommentReply = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email required" });
    }

    const parentComment = await Comment.findById(id);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const reply = parentComment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }

    const likedIndex = reply.likes.indexOf(userEmail);
    if (likedIndex > -1) {
      reply.likes.splice(likedIndex, 1);
    } else {
      reply.likes.push(userEmail);
    }

    await parentComment.save();
    res.status(200).json({ success: true, message: "Reply like toggled", data: parentComment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle reply like", error: error.message });
  }
};

/**
 * Increment share counter on a Comment
 */
export const shareComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    res.status(200).json({ success: true, message: "Comment shared", data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to record share", error: error.message });
  }
};

/**
 * Add a reply to AfterLoginComment
 */
export const replyToAfterLoginComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, user } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({ success: false, message: "Reply text is required" });
    }

    const parentComment = await AfterLoginComment.findById(id);
    if (!parentComment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    parentComment.replies.push({
      comment: comment.trim(),
      user: user || 'Anonymous',
      likes: [],
      createdAt: new Date()
    });

    await parentComment.save();
    res.status(201).json({ success: true, message: "Reply added", data: parentComment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add reply", error: error.message });
  }
};

/**
 * Like/unlike an AfterLoginComment
 */
export const likeAfterLoginComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userIdentifier = req.body.userEmail || req.body.user;

    if (!userIdentifier) {
      return res.status(400).json({ success: false, message: "User or user email required" });
    }

    const comment = await AfterLoginComment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const likedIndex = comment.likes.indexOf(userIdentifier);
    if (likedIndex > -1) {
      comment.likes.splice(likedIndex, 1);
    } else {
      comment.likes.push(userIdentifier);
    }

    await comment.save();
    res.status(200).json({ success: true, message: "Like toggled", data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle like", error: error.message });
  }
};

/**
 * Share an AfterLoginComment
 */
export const shareAfterLoginComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await AfterLoginComment.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    res.status(200).json({ success: true, message: "Comment shared", data: comment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to record share", error: error.message });
  }
};