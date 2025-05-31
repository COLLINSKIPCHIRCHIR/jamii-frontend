import React,{ useEffect, useState } from "react" 
import { useParams, useNavigate } from "react-router-dom"
import api from '../services/api';
import './productDetails.css'
const baseURL = import.meta.env.VITE_API_URL;




const ProductDetails = () => {
  const {id} = useParams(); //gets product id from url
  const navigate = useNavigate();

  const [product, setproduct] = useState(null);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

//chat-related state
const [chatId, setChatId] = useState(null);
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [isSafetyGuideOpen, setIsSafetyGuideOpen] = useState(false);

  useEffect(() => {

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setproduct(response.data);
      } catch (err) {
        console.error(err);
        setError('Product not found')
      }
    }
    fetchProduct();
  }, [id]);

const currentUser = JSON.parse(localStorage.getItem('user'));
const isSeller = currentUser && product?.createdBy && currentUser._id === product.createdBy._id;


  const startChat = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to start a chat');
        return;
      }

      //guard clause for product or createdBy
      if (!product || !product.createdBy) {
        setError('Product details incomplete; refresh the page');
        return;
      }
      const res = await api.post('/chat/start', 
      {
        productId: id,
        sellerId: product.createdBy._id
      },
      
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
      //redirect to chat page
      navigate (`/chats`);
    } catch (err) {
      console.error('Failed to start chat:', err);
      setError('Failed to start chat');
    }
  };

  const fetchMessages = async (chatId, token) => {
    try {
      const res = await api.get(`/chat/${chatId}/messages`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch messages:', err)
      setError('Failed to fetch messages');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(
        `/chat/${chatId}/messages`, 
        { text: newMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message')
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!product) return <p className="loading">loading...</p>;
  
  return (
    <div className="product-details">
      <div className="product-header">
        <h2>{product.name}</h2>
      </div>
      <div className="product-content">
        <div className="product-images">
          <div className="slideshow">
            <button onClick={() => setCurrentImageIndex(prev => (prev - 1 + product.images.length) % product.images.length)} 
              className="slideshow-button"
            >
              ◀
            </button>
            <img
              src={`${baseURL}${product.images[currentImageIndex]}`}
              alt="Product"
              className="product-image"
            />
            <button onClick={()=> setCurrentImageIndex(prev => (prev + 1)  % product.images.length)}
              className="slideshow-button"
            >
              ▶
            </button>
          </div>
          <div className="thumbnails">
          {product.images && Array.isArray(product.images) ? (
            product.images.map((img, index) => (
            img && (
            <img
            key={index}
            src={`${baseURL}${img}`}
            alt={`Thumbnail ${index}`}
            className={`thumbnail ${index === currentImageIndex ?
              'active' : ''
            }`}
            onClick={() => setCurrentImageIndex(index)}
            />
          )
            ))
          ) : (
            <p className="loading">No thumbnails available</p>
          )}
          </div>
        </div>
        <div className="product-info">
          <p className="description"><strong>Description:</strong>{product.description}</p>
          <p className="price"><strong>Price:</strong> KES {product.price}</p>
          <p><strong>Category:</strong>{product.category}</p>
          <p><strong>Location:</strong>{product.location}</p>
        </div>
        <div className="contact-info">
          <h3>Contact Information</h3>
          <p><strong>Name:</strong>{product.createdBy?.name}</p>
          <p>
            <strong>Email:</strong>{' '}
            <a href={`mailto:${product.createdBy?.email?.trim()}`}
            className="contact-link">
              📧 {product.createdBy?.email?.trim()}
            </a>  
          </p>
          <p><strong>Phone:</strong>{' '}
            <a href={`tel:${product.createdBy?.phone?.trim()}`}
            className="contact-link">
              📞 {product.createdBy?.phone?.trim()}
            </a>
          </p>
        </div>
        <div className="safety-guide">
          <button
            onClick={() => setIsSafetyGuideOpen(!isSafetyGuideOpen)}
            className="safety-guide-toggle"
          >
            Safety Guide {isSafetyGuideOpen ? '▲' : '▼' }
          </button>
          {isSafetyGuideOpen && (
            <div className="safety-guide-content">
              <p>
                <strong>Verify Seller Identity:</strong>Always confirm the seller’s identity before making payments. Use the provided contact details to communicate directly.
              </p>
              <p>
                <strong>Meet in safe Locations:</strong>Arrange to meet in public,well-lit places like malls
              </p>
              <p>
                <strong>Inspect the product:</strong>Check the item thoroughly before paying. Ensure it matches the description and images provided.
              </p>
              <p>
                <strong>Avoid Advance Payments:</strong>Be cautious about paying upfront, especially via mobile money (e.g., M-Pesa). Use cash on delivery when possible.
              </p>
              <p>
                <strong>Report Suspicious Activity:</strong>If something feels off, report the listing to our platform immediately for investigation.
              </p>
            </div>
          )}
        </div>
        <div className="chat-section">
          <h3>Chat with seller</h3>
          {!isLoggedIn ? (
            <p>Please log in to start chat</p>
          ) : isSeller ? (
            <p>You cannot initiate a chat on your own product</p>
          ) : (
            <button onClick={startChat} className="chat-button">
              Start Chat
            </button>
          )}
          
        </div>

      </div>
      
    </div>
  )
}

export default ProductDetails