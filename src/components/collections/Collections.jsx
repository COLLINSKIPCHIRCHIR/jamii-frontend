import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Collections.css'
import api from '../../services/api'

const baseURL = import.meta.env.VITE_API_URL 

const Collections = () => {
    const [categories , setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('${baseURL}/api/categories/allCategories')
                setCategories(res.data);
            } catch (err) {
                console.error ('Error fetching categories:', err)
                setError('Failed to load categories.')
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    },[]);

    

  return (
    <div className='collections'>
        <h2>Shop category</h2>


        {loading ? <p>Loading categories...</p> :
        error ? <p>{error}</p> :
       
        <div className="collection-links">
        {categories.map((cat) => (
          <Link key={cat.name} to={`/category/${cat.name}`} className="collection-item">
            {/*Display the image of each category */}
            <img src={`${baseURL}${cat.image}`} 
            alt={cat.name} 
            onError={(e) => {
                e.target.src = '${baseURL}/images/categories/default.png';
            }}
            
            />
            <span>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</span>
          </Link>
        ))}  
        </div>
         }
    </div>
  )
}

export default Collections