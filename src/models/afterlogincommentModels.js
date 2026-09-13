import mongoose from "mongoose";

const afterloginReplySchema = new mongoose.Schema({
  comment: { type: String, required: true },
  user: { type: String },
  likes: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const afterloginSchema = new mongoose.Schema(
  {
    comment: { type: String, required: true },
    user: { type: String }, // optional (email/username)
    likes: [{ type: String }],
    shares: { type: Number, default: 0 },
    replies: [afterloginReplySchema]
  },
  { timestamps: true }
);

export const AfterLoginComment = mongoose.model(
  "AfterLoginComment",
  afterloginSchema
);
