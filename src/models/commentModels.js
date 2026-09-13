import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  comment: { type: String, required: true },
  userEmail: { type: String },
  userName: { type: String },
  userAvatar: { type: String },
  likes: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true },
    userEmail: { type: String },
    userName: { type: String },
    userAvatar: { type: String },
    likes: [{ type: String }], // Array of user emails or IDs
    dislikes: [{ type: String }],
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    replies: [replySchema]
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);
