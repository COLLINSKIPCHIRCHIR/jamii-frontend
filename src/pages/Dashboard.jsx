import React, { useEffect, useState} from 'react'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
const imageURL = import.meta.env.VITE_IMAGE_URL

const Dashboard = () => {
  //state to hold the ads fetched from backend
  const [ads, setAds ] = useState([]);

  //state to show if data is loading
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  
  const navigate = useNavigate();

  //clear profile messages after 5 seconds
  useEffect(() => {
    if (profileMessage || profileError) {
      const timer = setTimeout(() => {
        setProfileMessage('');
        setProfileError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage, profileError])

  //Fetch user, ads, and chats on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');

      try {
        const userResponse = await api.get('/users/me',{
          headers: { Authorization: `Bearer ${token}`}
        });
        console.log("Fetched user data:", userResponse.data);
        setUser(userResponse.data);
        const profilePicPath = userResponse.data.profilepic?.trim() || '';
        setProfilePic(profilePicPath);
        console.log('Dashboard imageURL:', imageURL);
        console.log('Dashboard profilePic:' , profilePicPath);
        console.log('Dashboard full URL:', `${imageURL.replace(/\/$/, '')}/${profilePicPath}`);

        //Get ads
        const adsResponse = await api.get('ads/mine', {
          headers: { Authorization: `Bearer ${token}`},
        });
        console.log("Fetched ads:" , adsResponse.data);
        setAds(adsResponse.data);

        //get chats
        const chatsRes = await api.get('/chat/conversations', {
          headers: { Authorization: `Bearer ${token}`},
        });
        console.log("Fetched chats:", chatsRes.data);
        setChats(chatsRes.data);
      } catch (error) {
       console.error('Dashboard error:', error.response?.data, error.message);
       setProfileError(
        error.response?.data?.message || 'Failed to load dashboard data'
       ); 
       if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
       }
      } finally {
        setLoading(false)
      }
    } 

    fetchData();
  }, [navigate]);

  //handle file selection and preview
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError('Please select an image file')
        return;
      }
      if (file.size > 5 *1024 * 1024) { //5mb limit
        setProfileError('Image size must be less than 5mb')
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl('');
    }
  };

  //handle profile picture upload/update
  const handleProfilePicUpdate = async () => {
    if (!selectedFile) {
      setProfileError('Please select an image');
      return;
    }
    setProfileMessage('');
    setProfileError('');
    setProfileLoading(true);

    const formData = new FormData();
    formData.append('profilepic' , selectedFile);

    try {
      const token = localStorage.getItem('token');
      console.log('Dashboard: Token for profile pic update:', token);
      const res = await api.put('/users/profile-pic', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      console.log("Selected file for profile update:", selectedFile);
      setProfilePic(res.data.profilepic.trim() ? `/uploads/${res.data.profilepic}` : '');
      setProfileMessage(res.data.message);
      setSelectedFile(null);
      setPreviewUrl('');
      //update user state
      setUser((prev)=> ({...prev, profilepic: res.data.profilepic}));
    } catch (err) {
      console.error('Dashboard: Profile pic update failed:', err.response?.data, err.message);
      setProfileError(err.response?.data?.message || 'Failed to update profile picture');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setProfileLoading(false);
    }
  }

  //handle profile picture deletion
  const handleProfilePicDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your profile picture?');
    if (!confirmDelete) return;

    setProfileMessage('');
    setProfileError('');
    setProfileLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await api.delete('/users/profile-pic', {
        headers: {Authorization: `Bearer ${token}`},
      });
      setProfilePic('')
      setProfileMessage(res.data.message);
      setSelectedFile(null);
      setUser((prev) => ({...prev, profilepic: ''}))
    } catch (err) {
      console.error('Profile Pic delete failed:' , err.response?.data, err.message);
      setProfileError(err.response?.data?.message || 'Failed to delete profile picture');
    } finally {
      setProfileLoading(false);
    }
  };

    //handle ad deletion
  const handleDelete = async (adId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this ad?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/ads/${adId}`);
      setAds((prev) => prev.filter((ad) => ad._id !== adId));
    } catch (error) {
      console.error("Delete failed:", error.response?.data, error.message);
      setProfileError(error.response?.data?.message || 'Failed to delete ad')
    }
  };

//handle ad edit
  const handleEdit = (ad) => {
    navigate(`/edit-ad/${ad._id}`);
  }


  //filter and sort ads
  const filteredAds = ads
    .filter(ad =>
      ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a,b) => {
      switch (sortOption) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
          default:
            return 0 ;
      }
    });


  return (
    <div className="dashboard-container">
      {/*profile section*/}
      <div className="profile-section">
        <h2>Welcome, {user?.name || 'User'}</h2>
        {profileMessage && <p className='success'>{profileMessage}</p>}
        {profileError && <p className='error'>{profileError}</p>}
        <div className="profile-pic-container">
          {previewUrl ? (
            <img src={previewUrl} alt= 'Profile Preview'
            className='profile-pic' />
          ) : profilePic ? (
            <img 
            src={`${imageURL.replace(/\/$/, '')}${profilePic}`} 
            alt={`${user?.name || 'User'}'s profile`}
            className='profile-pic'
            onError={(e) => {
              console.error('Profile pic failed to load:', e.target.src);
              e.target.src = '/placeholder.jpg';
            }} 
            />
          ) : (
            <div className="profile-pic-placeholder">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="profile-actions">
          <label className='file-input-label'>
            Choose Image
            <input 
            type= 'file'
            accept= "image/*"
            onChange={handleFileChange}
            hidden
            />
          </label>
          <button
            onClick={handleProfilePicUpdate}
            disabled={!selectedFile || profileLoading}
          >
            {profileLoading ? 'Uploading...' : profilePic ? 'Update Picture' : 'Add Picture'}
          </button>
          {profilePic && (
            <button
              onClick={ handleProfilePicDelete}
              disabled= {profileLoading}
              className='button-delete'
            >
              {profileLoading ? 'Deleting...' : 'Delete Picture'}
            </button>
          )}
        </div>
      </div>
      {/*ads section*/}
      <div className="ads-section">
        <div className="filters">
          <input
            type='text'
            placeholder='Search your ads'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='search-input'
          />
          <select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)} 
            className='sort-select'
          >
              <option value="">Sort By</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
          </select>
        </div>
      
      <h2>Your ads</h2>
          {loading ? (
            <p>Loading...</p>
          ) : ads.length === 0 ? (
            <p>You haven't posted any ads yet. Click "Post Item" to get started!.</p>
          ) : (
            <>
              {filteredAds.length === 0 ? (
                <p>No ads matched your search.</p>
              ) : (
                <div className="ads-list">
                  {filteredAds.map((ad) => (
                    <div key={ad._id} className="ad-card">
                        {ad.images && ad.images[0] && typeof ad.images[0] ===
                        'string' && ad.images[0].trim() !== '' ? ( 
                          <img 
                            src={`${imageURL.replace(/\/$/, '')}${ad.images[0]}`} 
                            alt={ad.name}  
                            className='ad-image' 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.jpg";
                            }}
                          />
                        ) : (
                          <img 
                            src="/placeholder.jpg"
                            alt='No image'
                            className='ad-image'
                          />
                        )}
                        <h3>{ad.name}</h3>
                        <p>{ad.description}</p>
                        <p>
                          <strong>Price:</strong> KES {ad.price}
                        </p>
                        <div className="ad-actions">
                          <button onClick={() => handleEdit(ad)}>Edit</button>
                          <button onClick={() => handleDelete(ad._id)}>Delete</button>
                        </div>
                    </div>
                  ))}
                </div>

              )}
            </>
          )}
      </div>
      {/*chats section*/}
      <div className="chats-section">
        <h3>Your Chats</h3>

        {chats.length === 0 ? (
          <p>No chats Yet.</p>
        ): (
          <ul className='chat-list'>
          {chats.map((chat) => {
            const other = chat.participants.find((p) => p._id !== user?._id);
            return (
              <li key={chat._id} className='chat-item'> 
                <strong>{other?.name || 'Unknown'}</strong> -{' '}
                <span>{chat.product?.name || 'Product'}</span>

              </li>
            );
          })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Dashboard