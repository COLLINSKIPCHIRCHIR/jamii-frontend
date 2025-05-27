import {useState, useRef, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'
import  debounce  from 'lodash/debounce';
import './SearchBar.css';

const SearchBar = () => {
    const [term , setTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const boxRef = useRef(null);

    /* debounce search */
    //eslint-disable-next-line react-hooks/exhaustive-deps
    const runSearch = debounce(async (q) => {
        if (!q.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/products?search=${encodeURIComponent(q)}`);
            setResults(res.data);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }, 300);

    /* input onchange handler */
    const handleChange = (e) => {
        const q = e.target.value;
        setTerm(q);
        runSearch(q);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (term.trim()) {
            navigate(`/search?query=${encodeURIComponent(term.trim())}`)
            setResults([])
        }
        
    };

    const handleResultClick = (id) => {
        navigate(`/product/${id}`);
        setTerm('');
        setResults([]);
    };

    //click outside closes dropdown
    useEffect(() => {
        const clickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setResults([]);
            }
        }
        document.addEventListener('mousedown', clickOutside);
        return () => document.removeEventListener('mousedown', clickOutside);
    }, []);

  return (
    <div className='searchbar-wrapper' ref={boxRef}>
        <form onSubmit={handleSubmit} className='searchbar-form'>
            <input
                type='text'
                value={term}
                onChange={handleChange}
                placeholder='Search products...'
                className='searchbar-input'
                aria-label='Search products'
            />
            <button type='submit' disabled={loading} className='searchbar-btn'>
                {loading ? '...' : 'Search'}
            </button>
        </form>

        {results.length > 0 &&(
          <div className="searchbar-dropdown">
            {results.map((p) => (
                <div
                    key={p._id}
                    className='searchbar-item'
                    tabIndex={0}
                    role='button'
                    onClick={() => handleResultClick(p._id)}
                    onKeyDown={(e) => 
                        e.key === 'Enter' && handleResultClick(p._id)
                    }
                >
                    {p.name}
                </div>
            ))}
          </div>  
        )}

    </div>
  )
}

export default SearchBar