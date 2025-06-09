import React, {useState, useRef, useEffect} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'
import './postAd.css';
const baseURL = import.meta.env.VITE_API_URL;
import locationsData from '../data/kenya_administrative_structure.json'

const PostAd = () => {
  const navigate = useNavigate();
  const { adId } = useParams(); //editing
  const fileInputRef = useRef(null); //for file selection

//location hierarchy state
// county - sub-county - ward - location 
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [wards, setWards] = useState([]);
  const [locations, setLocations] = useState([]);

  const [selectedCounty, setSelectedCounty] = useState('');
  const [selectedSubCounty, setSelectedSubCounty] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');


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
      console.error('Failed to load reference data:', err);
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
        setForm({ name: data.name, description: data.description, price: data.price, images: data.images || [] });
          //pre-select category / location
          setSelectedCategory(data.category);
          setSelectedSubCategory(data.subcategory);
          setSelectedCounty(data.county);
          setSelectedSubCounty(data.subCounty);
          setSelectedWard(data.ward);
          setSelectedLocation(data.location);
      } catch (err) {
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
    setWards([]); setLocations([]);
}, [selectedCounty]);

useEffect(() => {
    if (!selectedSubCounty) { setWards([]); setSelectedWard(''); return;};
    const county = locationsData.find(c => c.county === selectedCounty);
    const sub = county?.subCounties?.find(s => s.name === selectedSubCounty);
    console.log('SubCounty:', sub);
    const sorted = (sub?.wards || []).map(w => w.name).sort((a, b) => a.localeCompare(b));
    setWards(sorted);
    setSelectedWard('');
    setLocations([]); 
}, [selectedSubCounty, selectedCounty]);

useEffect(() => {
    if (!selectedWard) { setLocations([]); setSelectedLocation(''); return; }
    const county = locationsData.find(c => c.county === selectedCounty);
    const sub = county?.subCounties?.find(s => s.name === selectedSubCounty);
    const ward = sub?.wards?.find(w => w.name === selectedWard);
    
    console.log('Selected:', selectedCounty, selectedSubCounty, selectedWard);
    console.log('Available ward names:', sub?.wards?.map(w => w.name));
    console.log('Ward:', ward);

    if (!ward) {
      console.warn('No matching ward found for:', selectedWard);
      return;
    }

    const sorted = (ward?.locations || []).sort((a, b) => a.localeCompare(b));
    setLocations(sorted);
    setSelectedLocation('');
}, [selectedWard, selectedSubCounty, selectedCounty]);



//category - subcategory cascade
const handleCategoryChange = (e) => {
  const cat = e.target.value;
  setSelectedCategory(cat);
  const found = categories.find((c) => c.name === cat );
  setSubCategories(found?.subcategories || []);
  setSelectedSubCategory('');
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
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...data],
      }));
    } catch (error) {
      console.error('Upload error:', error.response?.data || err.message);
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
      category: selectedCategory,
      subcategory: selectedSubCategory,
      county: selectedCounty,
      subCounty: selectedSubCounty,
      ward: selectedWard,
      location: selectedLocation,
    };

    try {
      setLoading(true);
      if (adId) {
        await api.put(`/ads/${adId}`, payload, {
          headers: { Authorization: `Bearer ${token}`}
        });
      } else {
        await api.post('/products', payload, {
          headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`, //send token with request
          }
        });
        //on success redirect home
        navigate('/dashboard');
      } 
    } catch (error) {
      console.error('Post error:', error.response?.data || error.message);
      setError('Failed to submit ad.please try again.');
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
            {form.images.map(img  => (
              <div key={img} className="image-wrapper" style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
                <img
                  src={`${baseURL}${img}`}
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

       {selectedCategory && (
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
       {selectedSubCounty && (
          <label>Ward
            <select value={selectedWard} onChange={e=>setSelectedWard(e.target.value)} required>
              <option value="">Select</option>
              {renderOptions(wards)}
            </select>
          </label>
      )}
      {selectedWard && (
          <label>Location
            <select value={selectedLocation} onChange={e=>setSelectedLocation(e.target.value)} required>
              <option value="">Select</option>
              {renderOptions(locations)}
            </select>
          </label>
      )}  

      <pre style={{ fontSize: '12px', color: 'gray' }}>
        {JSON.stringify(locations, null, 2)}
      </pre>

  
        <button type='submit' disabled={loading}>
          {loading ? 'Submitting...' : adId ? 'Update Ad' : 'Post Ad'}
        </button>
      </form>
    </div>
  );
};

export default PostAd