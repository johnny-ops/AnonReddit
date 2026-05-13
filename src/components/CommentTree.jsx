import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../lib/supabase';
import { getAnonId, getAnonName } from '../lib/auth';
import InteractionBar from './InteractionBar';

export default function CommentTree({ comments, parentId = null, postId }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    const { data } = await supabase
      .from('comments')
      .insert([{
        post_id: postId,
        parent_id: parentCommentId,
        content: replyContent,
        author_id: getAnonId(),
        author_name: getAnonName()
      }]);
    
    setReplyContent('');
    setReplyingTo(null);
    // Reload happens at the parent component in a real app, 
    // but for this simple version we might need a callback or global state.
    // We will just do a window.location.reload() for simplicity, or we can pass a refresh function.
    window.location.reload(); 
  };

  const visibleComments = comments.filter(c => c.parent_id === parentId);

  if (visibleComments.length === 0) return null;

  return (
    <div className="replies-container">
      {visibleComments.map(comment => (
        <div key={comment.id} className="comment animate-fade-in">
          <div className="comment-card">
            <div className="comment-header">
              <span className="author-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                {comment.author_name.charAt(0).toUpperCase()}
              </span>
              <span className="comment-author">{comment.author_name}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(comment.created_at))} ago</span>
            </div>
            <div className="comment-content">
              {comment.content}
            </div>
            
            <InteractionBar 
              commentId={comment.id} 
              initialVotes={comment.votes ? comment.votes.reduce((acc, v) => acc + v.vote_type, 0) : 0}
              onCommentClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            />

            {replyingTo === comment.id && (
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="input" 
                  autoFocus
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Reply</button>
              </form>
            )}
          </div>
          
          {/* Recursive Replies */}
          <CommentTree comments={comments} parentId={comment.id} postId={postId} />
        </div>
      ))}
    </div>
  );
}
