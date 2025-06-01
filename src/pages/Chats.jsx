import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

//load current user from local storage
useEffect(()=> {
    const userInfo = JSON.parse(localStorage.getItem('user'));
    setUser(userInfo);
}, []);

  useEffect(() => {
    // Fetch all conversations for the logged-in user
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(res.data) && user) {
            const enhancedConversations = res.data.map((conv) =>{
                const other = Array.isArray(conv.participants)
                ? conv.participants.find((p) => p._id !== user._id)
                : {};
                return {
                    ...conv,
                    otherUserName: other?.name || 'Unknown User',
                };
            });
            setConversations(enhancedConversations);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    if (user) fetchConversations();
  }, [user]);

  //load messages in the selected chat
  const loadMessages = async (chatId) => {
    setSelectedChat(chatId);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);

      //mark messages as read
      await api.post(`/chat/${chatId}/mark-read`, {},{
        headers: { Authorization: `Bearer ${token}`}
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  //send message
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(
        `/chat/${selectedChat}/messages`,
        { text: trimmed },
        { headers: { Authorization:   `Bearer ${token}`}}
      );
      setMessages((prev) => [...prev, res.data]);
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '10px' }}>
        <h2>Your Chats</h2>
        {conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => loadMessages(conv._id)}
              style={{
                padding: '10px',
                borderBottom: '1px solid #eee',
                cursor: 'pointer',
                backgroundColor: selectedChat === conv._id ? '#f0f0f0' : 'white',
              }}
            >
              {conv.otherUserName} — {conv.productName}
            </div>
          ))
        )}
      </div>

      {/* Chat Window */}
      <div style={{ width: '70%', padding: '10px' }}>
        {selectedChat ? (
          <div>
            <h3>Messages</h3>
            <div style={{ maxHeight: '80vh', overflowY: 'scroll', border: '1px solid #ddd', padding: 10 }}>
              {messages.length === 0 ? (
                <p>No messages yet.</p>
              ) : (
              messages.map((msg) => (
                <div key={msg._id} style={{ marginBottom: 8}}>
                  <strong>{msg.sender?.name || 'Unknown'}:</strong> {msg.text}
                </div>
              ))
              )}
            </div>
            <div style={{ marginTop: 10 }}>
              <input 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Type a message'
                style={{ width: '75%', padding: 6 }}
              />
              <button onClick={sendMessage} style={{ padding: 6 }}>Send</button>
            </div>
          </div>
        ) : (
          <p>Select a chat to view messages</p>
        )}
      </div>
    </div>
  );
};

export default Chats;
