import React, {useEffect, useState } from 'react'
import './Categories.css'
import api from '../../services/api'
import { useParams, useLocation } from 'react-router-dom'
import ProductCard from '../ProductCard'
import { useDebounce } from 'use-debounce'

function CategoryPage() {

    const { category } = useParams();
    const [products, setProducts] = useState([])
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sort, setSort] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const sub = queryParams.get('sub');

    const [debouncedSearch] = useDebounce(searchTerm, 300);

    useEffect(()=> {
      setPage(1);
      setSearchTerm('');
    }, [category, sub]);

    useEffect (() =>{
    const fetchByCategory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', {
          params: {
            search: debouncedSearch,
            sort: sort === 'low' ? 'price_asc' : sort === 'high' ? 'price_desc' : '',
            category,
            subcategory: sub,
            page,
            limit: 16
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
  }, [category, sub, searchTerm, sort, page]);

  useEffect(() => {
    window.scrollTo({top: 0, behavior: 'smooth'})
  }, [category, sub, page]);

  useEffect(() => {
    document.title = sub
    ? `${sub} - ${category} | Marketplace`
    : `${category} Products | Marketplace`;
  }, [category, sub]);

  const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(prev -1, 1))
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages))
  };

    const sortedProducts = [...products].sort((a,b) =>{
      if (sort === 'low') return a.price - b.price;
      if (sort === 'high') return b.price - a.price;
      return 0;
    })

  return (
    <div className="category-page">
      <h2>{cap(category)}{sub && ` > ${cap(sub)}`}</h2>
        
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
            ) : sortedProducts.length === 0 ? (
              <p>No products found in this category.</p>
            ) : (
            <>
              <div className="product-list">
                {sortedProducts.map((item) => (
                  <ProductCard
                    key={item._id}
                    _id={item._id}
                    name={item.name}
                    price={item.price}
                    county={item.county}
                    subcounty={item.subcounty}
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