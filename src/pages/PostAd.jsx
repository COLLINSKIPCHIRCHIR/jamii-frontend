import React, {useState, useRef, useEffect} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import './postAd.css';
const baseURL = import.meta.env.VITE_API_URL;
const imageURL = import.meta.env.VITE_IMAGE_URL;

import locationsData from '../data/kenya_administrative_structure.json'

console.log('API Base URL:', baseURL);

const PostAd = () => {
  const navigate = useNavigate();
  const { adId } = useParams(); //editing
  const fileInputRef = useRef(null); //for file selection

//location hierarchy state
// county - sub-county  
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedSubCounty, setSelectedSubCounty] = useState('');
  
  const [categories, setCategories] = useState([]); // { name, subcategories[] }
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');

  //1. Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    images: [],// multiple images
  });
  const  [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadRefData = async () => { 
    try {
      const categoryRes = await api.get('/categories'); //fetch from backend
      const seen = new Set();
      const uniqueCategories = [];

      for (const cat of categoryRes.data) {
        const name = cat.name.toLowerCase();
        if (!seen.has(name)) {
          seen.add(name);
          uniqueCategories.push(cat);
        }
      }
      setCategories(uniqueCategories);

      const countryList = locationsData
        .map(c => c.county?.trim())
        .sort((a, b) => a.localeCompare(b));

      setCounties(countryList);
      console.log('Loaded counties:', countryList.length);
    } catch (err) {
      console.error('Failed to load reference data:', err.message);
    }
  };

    loadRefData();
  }, []);


  //prefill when editing
  useEffect(()=> {
      if (!adId) return;
      (async () => { 
      try {
        const {data} = await api.get(`/ads/${adId}`,{
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        console.log('Fetched ad data:', data);
        setForm({ name: data.name, description: data.description, price: String(data.price), images: data.images || [] });
          //pre-select category / location
          setSelectedCategory(data.category);
          setSelectedSubCategory(data.subcategory);
          setSelectedCounty(data.county);
          setSelectedSubCounty(data.subcounty);
      } catch (err) {
        console.log('Editing adId:', adId);
        console.error('Error loading ad:' , err.message);
        setError('Failed to load ad for editing.')
      }
    }) ();
    
  }, [adId]);

//cascading fetches for locations

useEffect(() => {
    if (!selectedCounty) return setSubCounties([]);
    const county = locationsData.find(c => c.county === selectedCounty);
    console.log('County:', county);
    const sorted = (county?.subCounties || []).map(s => s.name).sort((a, b) => a.localeCompare(b));
    setSubCounties(sorted);
    setSelectedSubCounty('');
}, [selectedCounty]);

//populate subcategories when selectedcategory changes
useEffect(() => {
  if (!selectedCategory) {
    setSubCategories([]);
    setSelectedSubCategory('');
    return;
  }
  const found = categories.find((c) => c.name === selectedCategory);
  setSubCategories(found?.subcategories || []);
  //only reset selectedsubCategory if it's not valid for the new category
  if (selectedSubCategory && !found?.subcategories.includes
  (selectedSubCategory)) {
      setSelectedSubCategory('');
  }
  
}, [selectedCategory, categories])


//category - subcategory cascade
const handleCategoryChange = (e) => {
  const cat = e.target.value;
  setSelectedCategory(cat);
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
      console.log("Form data being sent:", formData);
      const {data} = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,//
        }
      });
      console.log('Upload response:', data);
      console.log('Existing form.images:', form.images);

      //fix based on actual structure
      setForm((prev) => {
        const newImages = Array.isArray(data)
          ? data
          : data?.urls
          ? data.urls
          : data?.imageUrls
          ? data.imageUrls
          : [data];
        const uniqueImages = [...new Set([...prev.images, ...newImages])];
        return {
          ...prev,
          images: uniqueImages,
        };
      });
    } catch (error) {
      console.error('Upload error:', error.response?.data || error.message);
      setError('Failed to upload images')
    } finally {
      setUploading(false);
    }
  };

  //2 handle basic field change
  const handleChange = (e) =>{
    setForm({...form, [e.target.name]: e.target.value });
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

    const payload = {
      ...form,
      price: Number(form.price),
      images: form.images.flatMap(img => img.imageUrls || img),
      category: selectedCategory?.trim(),
      subcategory: selectedSubCategory?.trim(),
      county: selectedCounty?.trim(),
      subcounty: selectedSubCounty?.trim(),
    };

    //Validate payload
    const missingFields = [];
    if (!payload.name) missingFields.push('name');
    if (!payload.description) missingFields.push('description');
    if (isNaN(payload.price) || payload.price <= 0) missingFields.push('price');
    if (!payload.category) missingFields.push('category');
    if (!payload.subcategory) missingFields.push('subcategory');
    if (!payload.county) missingFields.push('county');
    if (!payload.subcounty) missingFields.push('subcounty');

    if (missingFields.length) {
      setError(`Please fill in: ${missingFields.join(', ')}`);
      setLoading(false);
      return;
    }

    console.log('Updating adId:', adId);
    console.log('Payload to send:', JSON.stringify(payload, null, 2));
    console.log('Token:', token);

    try {
      setLoading(true);
      if (adId) {
        const response = await api.put(`/ads/${adId}`, payload, {
          headers: { Authorization: `Bearer ${token}`}
        });
        console.log('Update response:', response.data);
        navigate('/dashboard');
      } else {
        const response = await api.post('/products', payload, {
          headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, //send token with request
          }
        });
        console.log('Create response:', response.data)
        //on success redirect home
        navigate('/dashboard');
      } 
    } catch (error) {
      console.error('Submit error:', error); // Show the full error
      console.error('Error response:', error.response?.data); // If API sent a response
      console.error('Error message:', error.message); // General JS error
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.message || 'Failed to submit ad.please try again.');
    } finally {
      setLoading(false);
    }

  }

  const handleImageDelete = async (imagePath) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this image?');
    if (!confirmDelete) return;

    try {
      //remove from the server
      await api.delete('/upload',{
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        data: {imagePath} //send image path in request body
      })

      //remove from ui
      setForm((prevForm) => ({
        ...prevForm,
        images: prevForm.images.filter(img => img !== imagePath),
      }));
    } catch (err) {
      console.error('Delete image failed:', err.response?.data || err.message);
      setError('Failed to delete image.')
    }
  };

  const renderOptions = arr => arr.map(v => <option key={v} value={v}>{v}</option>);

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
          Upload Images
          <input
          type='file'
          ref={fileInputRef}
          onChange={uploadFileHandler}
          accept='image/*'
          multiple
          />
          </label>
          {uploading && <p>Uploading...</p>}
         <div className="image-preview">
            {form.images.map((img, index )  => (
              <div key={`${img}-${index}`} className="image-wrapper" style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
                <img
                  src={`${imageURL}${img}`}
                  alt="Uploaded"
                  style={{ width: '100px', height: 'auto', borderRadius: '4px' }}
                />
              <button 
                type='button'
                onClick={() => handleImageDelete(img)}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  lineHeight: '18px',
                  textAlign: 'center',
                }}
              >
                &times;
              </button>
              </div>
            ))}
          </div> 
       
       {/*category*/}
       <label>Category
            <select value={selectedCategory} onChange={handleCategoryChange} required>
              <option value="">Select Category</option>
              {categories.map((cat) => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
            </select>
       </label>

       {selectedCategory && subCategories.length > 0 &&(
        <label>Sub-Category 
          <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} required>
            <option value="">Select Subcategory</option>
            {subCategories.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </label>
       )}
       {/*LOCATION CASCADE */}
       <label>County 
          <select value={selectedCounty} onChange={e => setSelectedCounty(e.target.value)} required>
            <option value="">Select</option>
            {renderOptions(counties)}
          </select>
       </label>

       {selectedCounty && (
         <label>Sub-County 
            <select value={selectedSubCounty} onChange={e => setSelectedSubCounty(e.target.value)} required>
              <option value="">Select</option>
              {renderOptions(subCounties)}
            </select>
         </label>
       )}

        <button type='submit' disabled={loading}>
          {loading ? 'Submitting...' : adId ? 'Update Ad' : 'Post Ad'}
        </button>
      </form>
    </div>
  );
};

export default PostAd