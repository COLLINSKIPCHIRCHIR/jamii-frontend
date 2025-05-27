import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const SearchResults = () => {
  const [results, setSearchResults] = useState([]);
  const query = new URLSearchParams(useLocation().search).get('query');

  
  useEffect(() => {
    const fetchResults = async () => {
      if (query) {
        try {
          const response = await axios.get(`http://localhost:5000/api/products?search=${query}`);
          console.log('search response:', response.data);

          //makes sure response.data is an array
          if (response.data && Array.isArray(response.data.products)) {
            setSearchResults(response.data.products);
          } else {
            setSearchResults([]); //fallback if data is not an array
          }
          
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]); //fallback on error
        }
      }
    }
    fetchResults();
  }, [query])

  const buildImageURl = (img) => {
    if (!img || img.trim() === "") return null; //no image
    if (img.startsWith("http")) return img; //already ful URL
    if (img.startsWith("/uploads")) return `http://localhost:5000${img}`; //
    return `http://localhost:5000/uploads/${img}`;
  };

  return (
    <div style={{ padding: '20px'}}>
      <h2>Search results for "{query}"</h2>
      {results.length === 0? (
        <p>No Products found.</p>
      ) : (
        <div className='search-result-grid' style={{ display: 'grid', gridTemplateColumn: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {results.map((item) => {
            const imageSrc = buildImageURl(item.images?.[0])
            console.log('Item Images:', item.images);

          return (
            <div 
            key={item._id} 
            className='search-card' 
            onClick={() => window.location = `/product/${item._id}`}
            style={{
              cursor: 'pointer', 
              border: '1px solid #ccc', 
              borderRadius: '8px', 
              padding: '10px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              backgroundColor: '#fff'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
            }}
            >
              {imageSrc ? (
                <img
                src={imageSrc}
                alt={item.name}
                style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px'}}
                />

              ) : (
                <img
                src="https://placehold.co/300x200?text=No+Image"
                alt = "No image"
                style = {{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                />
              )}

              <h3 style={{ margin: '10px 0 5px'}}>{item.name}</h3>
              <p style={{ color: '#555', fontSize: '14px'}}>{item.description?.slice(0, 80)}...</p>
            </div>
          )
        })}
        </div>
      )}


    </div>    
  )
}

export default SearchResults