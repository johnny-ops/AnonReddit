import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getAnonId, getAnonName } from '../lib/auth';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import InteractionBar from '../components/InteractionBar';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    // In a real app we would join with votes to get total score.
    // For simplicity, we fetch posts and we can fetch vote counts separately or inside the component
    // We'll calculate score on the fly or just rely on InteractionBar to fetch it
    const { data, error } = await supabase
      .from('posts')
      .select('*, votes(vote_type)')
      .order('created_at', { ascending: false });
    
    if (data) {
      const postsWithScore = data.map(post => {
        const score = post.votes ? post.votes.reduce((acc, v) => acc + v.vote_type, 0) : 0;
        return { ...post, score };
      });
      setPosts(postsWithScore);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const { data, error } = await supabase
      .from('posts')
      .insert([
        { 
          title: newTitle, 
          content: newContent,
          author_id: getAnonId(),
          author_name: getAnonName()
        }
      ])
      .select();

    if (data && data.length > 0) {
      setNewTitle('');
      setNewContent('');
      setPosts([{ ...data[0], score: 0 }, ...posts]);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Create a Post</h2>
        <form onSubmit={handleCreatePost} className="create-post-form">
          <input 
            type="text" 
            className="input" 
            placeholder="Title" 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <textarea 
            className="input" 
            placeholder="What's on your mind?"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Post</button>
          </div>
        </form>
      </div>

      <div className="posts-list">
        {posts.map(post => (
          <div key={post.id} className="glass-panel post-card animate-fade-in">
            <div className="post-header">
              <div className="author-avatar">
                {post.author_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>{post.author_name}</strong>
                <span style={{ margin: '0 0.5rem' }}>•</span>
                <span>{formatDistanceToNow(new Date(post.created_at))} ago</span>
              </div>
            </div>
            
            <Link to={`/post/${post.id}`}>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">
                {post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
              </p>
            </Link>

            <InteractionBar 
              postId={post.id} 
              initialVotes={post.score}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
