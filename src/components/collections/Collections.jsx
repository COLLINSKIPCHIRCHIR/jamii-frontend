import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Collections.css'
import api from '../../services/api'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { useRef } from 'react'

const imageBaseURL = import.meta.env.VITE_IMAGE_URL;


const Collections = () => {
    const [categories , setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories')

                //remove duplicates by category name
                const uniqueCategories = [];
                const seen = new Set();

                for (const cat of res.data) {
                  const lowerName = cat.name.toLowerCase();
                  if (!seen.has(lowerName)) {
                    seen.add(lowerName);
                    uniqueCategories.push(cat);
                  }
                }
                setCategories(uniqueCategories);
            } catch (err) {
                console.error ('Error fetching categories:', err)
                setError('Failed to load categories.')
            } finally {
                setLoading(false);
            }
        }
        fetchCategories();
    },[]);

    const toggleCategory = (catName, index) => {
      setExpandedCategory((prev) => (prev === catName ? null : catName));

      //Auto-scroll to center the clicked item
      const container = scrollRef.current;
      const item = container.children[index];
      const containerRect = container.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      const offset = itemRect.left - containerRect.left - container.offsetWidth / 2 + item.offsetWidth / 2;
      container.scrollBy({ left: offset, behavior: 'smooth'});
    };

    const scroll = (direction) => {
      if (scrollRef.current) {
        const scrollAmount = scrollRef.current.offsetWidth * 0.6;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth'})
      }
    };
    

  return (
    <div className='collections'>
        <h2>Shop category</h2>


        {loading ? (
          <p>Loading categories...</p>
         ) : error ? ( 
          <p>{error}</p> 
         ): (  
          <>
            <div className="scroll-controls">
              <button className='scroll-btn left' onClick={() => scroll('left') }>
                <FaChevronLeft />
              </button>
              <div className="collection-links" ref={scrollRef}>
                {/*friendly message if list is empty */}
                {!loading && categories.length === 0 && (
                  <p>No categories available.</p>
                )}
                {categories.map((cat, index) => (
                  <div key={cat.name} className='collection-wrapper'>
                    <div className="collection-item"
                      onClick={() => toggleCategory(cat.name, index)}
                    >
                      <img
                        src={`${imageBaseURL}${cat.image}`}
                        alt={cat.name}
                        onError={(e) => {
                          e.target.src = `${imageBaseURL}/images/categories/default.png`;
                        }}
                      />
                        <span>
                          {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
                        </span>
                    </div>

                    {expandedCategory === cat.name && cat.subcategories?.length > 0 && (
                      <div className='subcategory-list'>
                        {cat.subcategories.map((sub ,i) => (
                          <Link
                            to={`/category/${cat.name}?sub=${sub}`}
                            className='subcategory-badge'
                            key={i}
                          >
                            {sub.charAt(0).toUpperCase() + sub.slice(1)}
                          </Link>
                        ))}
                      </div>
                )}
          </div>
        ))}  
        </div>
        <button className='scroll-btn right' onClick={() => scroll('right')}>
          <FaChevronRight />
        </button>
        </div>
        </>
         )}
    </div>
  )
}

export default Collections