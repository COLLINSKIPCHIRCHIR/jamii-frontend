import React, {useEffect, useState } from 'react'
import './Categories.css'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import ProductCard from '../ProductCard'

function CategoryPage() {

    const { category } = useParams();
    const [products, setProducts] = useState([])
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect (() =>{
    const fetchByCategory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/products`, {
          params: {
            search: searchTerm,
            sort: sort === 'low' ? 'price_asc' : sort === 'high' ? 'price_desc' : '',
            category,
            page,
            limit: 6
          }
        });
        setProducts(res.data.products);
        setTotalPages(res.data.totalPages);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err.message);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchByCategory();
  }, [category, searchTerm, sort, page]);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev -1, 1))
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages))
  };

    const filteredProducts = products
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
          if (sort === 'low') return a.price - b.price;
          if (sort === 'high') return b.price - a.price;
          return 0;
        })

  return (
    <div className="category-page">
      <h2>{category.charAt(0).toUpperCase() + category.slice(1)} Products</h2>
        
      <div className='filters'>
        <input
            type='text'
            placeholder='Search within category'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
              className='filter-input'
              />
              <select 
              className='filter-select' 
              value={sort} 
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}>
                <option value="">Sort by</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
              </select>
            </div>
        
            {loading ? (
              <p>Loading products...</p>
            ) : error ? (
              <p>{error}</p>
            ) : filteredProducts.length === 0 ? (
              <p>No products found in this category.</p>
            ) : (
            <>
              <div className="product-list">
                {filteredProducts.map((item) => (
                  <ProductCard
                    key={item._id}
                    _id={item._id}
                    name={item.name}
                    price={item.price}
                    location={item.location}
                    images={item.images}
                  />
                ))}
              </div>

              <div className="pagination">
                <button onClick={handlePrevPage}>Previous</button>
                <span>
                  page {page} of {totalPages}
                </span>
                <button onClick={handleNextPage} disabled={page === totalPages}> 
                  Next
                </button>
              </div>
            </>
            )}
          </div>
        );}
        


export default CategoryPage;