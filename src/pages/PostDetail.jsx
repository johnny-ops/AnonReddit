import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAnonId, getAnonName } from '../lib/auth';
import { formatDistanceToNow } from 'date-fns';
import InteractionBar from '../components/InteractionBar';
import CommentTree from '../components/CommentTree';
import { ArrowLeft } from 'lucide-react';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostData();
  }, [id]);

  const fetchPostData = async () => {
    setLoading(true);
    
    // Fetch post
    const { data: postData } = await supabase
      .from('posts')
      .select('*, votes(vote_type)')
      .eq('id', id)
      .single();

    if (postData) {
      postData.score = postData.votes ? postData.votes.reduce((acc, v) => acc + v.vote_type, 0) : 0;
      setPost(postData);
    }

    // Fetch comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select('*, votes(vote_type)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (commentsData) setComments(commentsData);
    
    setLoading(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data } = await supabase
      .from('comments')
      .insert([{
        post_id: id,
        content: newComment,
        author_id: getAnonId(),
        author_name: getAnonName(),
        parent_id: null
      }])
      .select('*, votes(vote_type)');

    if (data && data.length > 0) {
      setNewComment('');
      setComments([...comments, { ...data[0], score: 0 }]);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center' }}>Loading post...</div>;
  if (!post) return <div className="container" style={{ textAlign: 'center' }}>Post not found.</div>;

  return (
    <div className="animate-fade-in">
      <Link to="/" className="btn" style={{ marginBottom: '1rem', background: 'transparent' }}>
        <ArrowLeft size={18} /> Back to Feed
      </Link>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div className="post-header">
          <div className="author-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }}>
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong style={{ fontSize: '1.1rem' }}>{post.author_name}</strong>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {formatDistanceToNow(new Date(post.created_at))} ago
            </div>
          </div>
        </div>
        
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{post.title}</h1>
        <p style={{ fontSize: '1.1rem', color: '#e2e8f0', marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>

        <InteractionBar 
          postId={post.id} 
          initialVotes={post.score}
        />
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Comments ({comments.length})</h3>
        
        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Comment
          </button>
        </form>

        <div className="comment-thread">
          {/* We start the tree with null parentId which renders top level comments */}
          <CommentTree comments={comments} postId={id} />
        </div>
      </div>
    </div>
  );
}
