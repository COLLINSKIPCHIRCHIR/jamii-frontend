import React, { useEffect, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import api from '../services/api';
import './Chat.css'; // Create this file for external styling
import { format, isToday, isYesterday } from 'date-fns'; // at the top


const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token'),
  },
});

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState(null);

  // Load user
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('user'));
    setUser(userInfo);
  }, []);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await api.get('/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(res.data) && user) {
          const updated = res.data.map((conv) => {
            const other = Array.isArray(conv.participants)
              ? conv.participants.find((p) => p._id !== user._id)
              : {};
            return {
              ...conv,
              otherUserName: other?.name || 'Unknown User',
            };
          });
          setConversations(updated);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    if (user) fetchConversations();
  }, [user]);

  // Handle socket for receiving messages
  useEffect(() => {
    if (!selectedChat) return;

    socket.emit('join-chat', selectedChat);

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, [selectedChat]);

  useEffect(() => {
    const container = document.querySelector('.chat-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);


  // Load messages for selected chat
  const loadMessages = async (chatId) => {
    setSelectedChat(chatId);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);

      // Mark as read
      await api.post(`/chat/${chatId}/mark-read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const res = await api.post(
        `/chat/${selectedChat}/messages`,
        { text: trimmed },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages((prev) => [...prev, res.data]);
      socket.emit('send-message', {
        chatId: selectedChat,
        message: res.data,
      });
      setText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  const groupedMessages = useMemo(() => {
    const groups = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt);
    let label = '';

    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else {
      label = format(date, 'MMMM d, yyyy');
    }

    if (!acc[label]) acc[label] = [];
    acc[label].push(msg);

    return acc;

  }, {});

  //sort messages inside each date group
  Object.keys(groups).forEach(label => {
    groups[label].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  });

  return groups;
  }, [messages]);

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <h2>Your Chats</h2>
        {conversations.length === 0 ? (
          <p>No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv._id}
              onClick={() => loadMessages(conv._id)}
              className={`chat-conversation ${selectedChat === conv._id ? 'active' : ''}`}
            >
              {conv.otherUserName} — {conv.productName}
            </div>
          ))
        )}
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {selectedChat ? (
          <div>
            <h3>Messages</h3>
            <div className="chat-messages-container" style={{ maxHeight: '80vh', overflowY: 'scroll', padding: 10 }}>
              {messages.length === 0 ? (
                <p>No messages yet.</p>
              ) : (
                Object.entries(groupedMessages)
                .sort(([labelA], [labelB]) => {
                  const getDateValue = (label) => { 
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (label === 'Today') return today.getTime();

                    if (label === 'Yesterday') {
                      const Yesterday = new Date(today);
                      Yesterday.setDate(Yesterday.getDate() -1);
                      return Yesterday.getTime();
                    } 

                    //for formatted labels like "May 2, 2025"
                    const parsed = new Date(label);
                    return isNaN(parsed.getTime()) ? 0 : parsed.setHours(0, 0, 0, 0);
                  };

                  return getDateValue(labelA) - getDateValue(labelB);
                })
              
                .map(([dateLabel, msgs]) => (
                  <div key={dateLabel}>
                    <div className="chat-date-label">{dateLabel}</div>
                    {msgs.map((msg) => {
                      const isMyMessage = msg.sender?._id === user?._id;
                      const time = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={msg._id}
                          className={`chat-message ${isMyMessage ? 'my-message' : 'other-message'}`}
                        >
                          <span className="chat-sender">{msg.sender?.name || 'Unknown'}:</span>
                          <span>{msg.text}</span>
                          <div
                            className="chat-timestamp"
                            title={new Date(msg.createdAt).toLocaleString()}
                          >
                            {time}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div style={{ clear: 'both'}}></div>
            </div>
            <div className="chat-input">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message"
              />
              <button onClick={sendMessage}>Send</button>
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
