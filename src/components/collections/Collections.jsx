import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Collections.css'
import axios from 'axios'

const Collections = () => {
    const [categories , setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/categories/allCategories')
                setCategories(res.data);
            } catch (err) {
                console.error ('Error fetching categories:', err)
            }
        }
        fetchCategories();
    },[]);

    

  return (
    <div className='collections'>
        <h2>Shop category</h2>
        <div className="collection-links">
        {categories.map((cat) => (
          <Link key={cat.name} to={`/category/${cat.name}`} className="collection-item">
            {/*Display the image of each category */}
            <img src={`http://localhost:5000${cat.image}`} 
            alt={cat.name} 
            onError={(e) => {
                e.target.src = 'http://localhost:5000/images/categories/default.png';
            }}
            
            />
            <span>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</span>
          </Link>
        ))}  
        </div>
    </div>
  )
}

export default Collections