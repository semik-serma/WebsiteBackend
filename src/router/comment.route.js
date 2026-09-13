import express from 'express';
import { 
  beforelogincomment,  // Changed from beforelogindisplaycomment
  beforelogindisplaycomment, 
  beforelogincommentgetById,
  usercommentname,
  afterlogincomments,
  afterlogincommentget,
  afterlogincommentgetById,
  likeComment,
  dislikeComment,
  incrementView,
  replyToComment,
  likeCommentReply,
  shareComment,
  replyToAfterLoginComment,
  likeAfterLoginComment,
  shareAfterLoginComment
} from "../controller/comment.controller.js";

export const commentroute = express.Router();

commentroute.post('/comment', beforelogincomment);  
commentroute.get('/commentget', beforelogindisplaycomment);
commentroute.get('/beforelogincomment/:id', beforelogincommentgetById);
commentroute.get('/useremail', usercommentname);

// Reply, Like, Share for main comments
commentroute.post('/comment/:id/reply', replyToComment);
commentroute.post('/comment/:id/reply/:replyId/like', likeCommentReply);
commentroute.post('/comment/:id/share', shareComment);
commentroute.post('/comment/:id/like', likeComment);
commentroute.post('/comment/:id/dislike', dislikeComment);
commentroute.post('/comment/:id/view', incrementView);

// After-login comments
commentroute.post('/afterlogincomment', afterlogincomments);
commentroute.get('/afterlogincommentsget', afterlogincommentget);
commentroute.get('/afterlogincomment/:id', afterlogincommentgetById);
commentroute.post('/afterlogincomment/:id/reply', replyToAfterLoginComment);
commentroute.post('/afterlogincomment/:id/like', likeAfterLoginComment);
commentroute.post('/afterlogincomment/:id/share', shareAfterLoginComment);