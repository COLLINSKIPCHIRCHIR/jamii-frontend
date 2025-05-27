import React, {useState, useRef, useEffect} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import './postAd.css';

const PostAd = () => {
  const navigate = useNavigate();
  const { adId } = useParams(); //editing
  const fileInputRef = useRef(null); //for file selection
  //1. Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    images: [],// multiple images
    category: '',
    location: '',
  });
  const  [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(()=> {
    const fetchAd = async () =>{
      if (!adId) return;
      try {
        const {data} = await api.get(`/api/ads/${adId}`,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        setForm({
          name: data.name,
          description: data.description,
          price: data.price,
          images: data.images || [],
          category: data.category,
          location: data.location,
        })
      } catch (err) {
        console.error('Error loading ad:' , err.message);
        setError('Failed to load ad.')
      }
    };
    fetchAd();
  }, [adId]);



  //2 handle inputs
  const handleChange = (e) =>{
    setForm({...form, [e.target.name]: e.target.value });
  };

  const uploadFileHandler = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++){
    formData.append('images', files[i]);
    }

    try { 
      setUploading(true);
      const {data} = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,//
        }
      });
      setForm({...form, images: data.imageUrls }); //set the returned URL
    } catch (error) {
      console.error('Upload error:', error.response?.data || err.message);
      setError('Failed to upload images')
    } finally {
      setUploading(false);
    }
  };
  //3 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true)
    setError(null);

    // check if token exists (user is logged in)
    const token = localStorage.getItem('token');
    if(!token) {
      navigate('/signup'); //redirect to signup if not logged in
      return;
    }

    console.log('Token;', token);
    console.log('Submitting form:', form); //see what is being posted

    try {
      if (adId) {
        await api.put(`/ads/${adId}`, form, {
          headers: { Authorization: `Bearer ${token}`}
        });
      } else {
        await api.post('/products', form, {
          headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, //send token with request
          }
        });
        //on success redirect home
        navigate('/dashboard');
      } 
    } catch (error) {
      console.error('Post error:', error.response?.data || error.message);
      setError('Failed to post ad.please try again.');
    } finally {
      setLoading(false);
    }

  }
  return (
    <div className='postad-container'>
      <h2>{adId ? 'Edit Your Ad' : 'Post a New Ad'}</h2>
      {error && <p className='error'>{error}</p>}
      <form onSubmit={handleSubmit} className='postad-form'> 
        <label>
          Title
          <input
            name= 'name'
            value={form.name}
            onChange={handleChange}
            required
          />  
        </label>
        <label>
          Description
          <textarea
            name='description'
            value={form.description}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Price (Ksh)
          <input
          name='price'
          type='number'
          value={form.price}
          onChange={handleChange}
          required
          />
        </label>
        <label>
          Upload Image
          <input
          type='file'
          ref={fileInputRef}
          onChange={uploadFileHandler}
          accept='image/*'
          multiple
          />
        </label>
        {uploading && <p>uploading...</p>}
        {form.images && form.images.map((image, index) => (
        image && <img key={index} src={`http://localhost:5000${image}`} alt='Uploaded' style={{ width:'100px',marginTop:'10px'}}/>))}
        <label>
          Category
          <input
          name='category'
          value={form.category}
          onChange={handleChange}
          required
          />
        </label>
        <label>
          Location
          <input
            name='location'
            value={form.location}
            onChange={handleChange}
            required
            />
        </label>

        <button type='submit' disabled={loading}>
          {loading ? 'Submitting...' : adId ? 'Update Ad' : 'Post Ad'}
        </button>
      </form>
    </div>
  )
}

export default PostAd