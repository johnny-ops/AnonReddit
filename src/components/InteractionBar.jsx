import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId } from '../lib/auth';
import { ArrowBigUp, ArrowBigDown, MessageSquare } from 'lucide-react';

const EMOJIS = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😡'
};

export default function InteractionBar({ postId, commentId, initialVotes = 0, onCommentClick }) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState(0);
  const [reactions, setReactions] = useState([]);
  const [userReaction, setUserReaction] = useState(null);
  const anonId = getAnonId();

  useEffect(() => {
    fetchInteractions();
  }, [postId, commentId]);

  const fetchInteractions = async () => {
    try {
      // Fetch user vote
      let query = supabase.from('votes').select('vote_type').eq('author_id', anonId);
      if (postId) query = query.eq('post_id', postId);
      if (commentId) query = query.eq('comment_id', commentId);
      
      const { data: voteData } = await query.single();
      if (voteData) setUserVote(voteData.vote_type);

      // Fetch all reactions
      let rxQuery = supabase.from('reactions').select('reaction_type, author_id');
      if (postId) rxQuery = rxQuery.eq('post_id', postId);
      if (commentId) rxQuery = rxQuery.eq('comment_id', commentId);

      const { data: rxData } = await rxQuery;
      if (rxData) {
        setReactions(rxData);
        const myRx = rxData.find(r => r.author_id === anonId);
        if (myRx) setUserReaction(myRx.reaction_type);
      }
    } catch (error) {
      console.error("Error fetching interactions", error);
    }
  };

  const handleVote = async (type) => {
    // Optimistic update
    const newVote = userVote === type ? 0 : type;
    const voteDiff = newVote - userVote;
    setVotes(prev => prev + voteDiff);
    setUserVote(newVote);

    if (newVote === 0) {
      // Delete vote
      let query = supabase.from('votes').delete().eq('author_id', anonId);
      if (postId) query = query.eq('post_id', postId);
      if (commentId) query = query.eq('comment_id', commentId);
      await query;
    } else {
      // Upsert vote
      const votePayload = {
        author_id: anonId,
        vote_type: newVote,
      };
      if (postId) votePayload.post_id = postId;
      if (commentId) votePayload.comment_id = commentId;

      // Handle conflict resolution manually if needed, or delete then insert
      let delQuery = supabase.from('votes').delete().eq('author_id', anonId);
      if (postId) delQuery = delQuery.eq('post_id', postId);
      if (commentId) delQuery = delQuery.eq('comment_id', commentId);
      await delQuery;

      await supabase.from('votes').insert([votePayload]);
    }
  };

  const handleReaction = async (rxType) => {
    const isRemoving = userReaction === rxType;
    const newReactionType = isRemoving ? null : rxType;
    setUserReaction(newReactionType);

    // Optimistic update of reactions list
    let newReactions = reactions.filter(r => r.author_id !== anonId);
    if (!isRemoving) {
      newReactions.push({ author_id: anonId, reaction_type: rxType });
    }
    setReactions(newReactions);

    // DB Update
    let delQuery = supabase.from('reactions').delete().eq('author_id', anonId);
    if (postId) delQuery = delQuery.eq('post_id', postId);
    if (commentId) delQuery = delQuery.eq('comment_id', commentId);
    await delQuery;

    if (!isRemoving) {
      const payload = { author_id: anonId, reaction_type: rxType };
      if (postId) payload.post_id = postId;
      if (commentId) payload.comment_id = commentId;
      await supabase.from('reactions').insert([payload]);
    }
  };

  // Group reactions for rendering
  const reactionCounts = reactions.reduce((acc, curr) => {
    acc[curr.reaction_type] = (acc[curr.reaction_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="interaction-bar">
      <div className="vote-controls">
        <button 
          className={`vote-btn ${userVote === 1 ? 'upvoted' : ''}`}
          onClick={() => handleVote(1)}
        >
          <ArrowBigUp size={24} fill={userVote === 1 ? 'currentColor' : 'none'} />
        </button>
        <span className="vote-count">{votes}</span>
        <button 
          className={`vote-btn ${userVote === -1 ? 'downvoted' : ''}`}
          onClick={() => handleVote(-1)}
        >
          <ArrowBigDown size={24} fill={userVote === -1 ? 'currentColor' : 'none'} />
        </button>
      </div>

      {onCommentClick && (
        <button className="action-btn" onClick={onCommentClick}>
          <MessageSquare size={18} />
          Reply
        </button>
      )}

      <div className="reaction-wrapper">
        <button className="action-btn">
          {userReaction ? EMOJIS[userReaction] : '😊 React'}
        </button>
        <div className="reactions-picker">
          {Object.entries(EMOJIS).map(([key, emoji]) => (
            <button 
              key={key} 
              className="reaction-btn"
              onClick={() => handleReaction(key)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="active-reactions">
        {Object.entries(reactionCounts).map(([type, count]) => (
          <span key={type} className={`reaction-badge ${userReaction === type ? 'user-reacted' : ''}`}>
            {EMOJIS[type]} {count}
          </span>
        ))}
      </div>
    </div>
  );
}
