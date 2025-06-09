import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchResults.css'; 

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SearchResults = () => {
  const [results, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const query = new URLSearchParams(useLocation().search).get('query');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(`/products?search=${query}`);
        const products = response.data?.products;

        if (Array.isArray(products)) {
          setSearchResults(products);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load search results.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const buildImageURL = (img) => {
    if (!img || img.trim() === "") return null;
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads")) return `${baseURL}${img}`;
    return `${baseURL}/uploads/${img}`;
  };

  return (
    <div className="search-results-container">
      <h2>Search results for "{query}"</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && results.length === 0 && (
        <p>No products found.</p>
      )}

      <div className="search-result-grid">
        {results.map((item) => {
          const imageSrc = buildImageURL(item.images?.[0]);

          return (
            <div
              key={item._id}
              className="search-card"
              onClick={() => navigate(`/product/${item._id}`)}
            >
              <img
                src={
                  imageSrc ||
                  "https://placehold.co/300x200?text=No+Image"
                }
                alt={item.name}
                className="search-image"
              />
              <h3>{item.name}</h3>
              <p>{item.description?.slice(0, 80)}...</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
