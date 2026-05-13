import { v4 as uuidv4 } from 'uuid';

export const getAnonId = () => {
  let anonId = localStorage.getItem('reddit_anon_id');
  if (!anonId) {
    anonId = uuidv4();
    localStorage.setItem('reddit_anon_id', anonId);
  }
  return anonId;
};

export const getAnonName = () => {
  let name = localStorage.getItem('reddit_anon_name');
  if (!name) {
    name = `Anon_${Math.floor(Math.random() * 10000)}`;
    localStorage.setItem('reddit_anon_name', name);
  }
  return name;
};
