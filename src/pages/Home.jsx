import React ,{useState, useEffect} from 'react'
import api from '../services/api'
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar/SearchBar';
import Collections from '../components/collections/Collections';
import './Home.css'

function HomePage() {
    const [userCounty, setUserCounty] = useState('');
    const [popularProducts, setPopularProducts] = useState([]);
  
//Detect user County (IP lookup)
useEffect(() => {
        const getCounty = async () => {
            try {
                const res = await fetch("https://ipapi.co/json/");
                const data = await res.json();
                console.log("Guessed county:", data.region);
                setUserCounty(data.region ?? '');
            } catch (err) {
                console.error("IP location fetch failed", err);
            }
        }

        getCounty();
    }, []);

    //fetch popular items once county is known
    useEffect(() => {
        if (!userCounty)  return;
        const fetchPopular = async () => {
            try {
                const { data } = await api.get(`/products/popular?county=${encodeURIComponent(userCounty)}`);
                setPopularProducts(data);
            } catch (err) {
                console.error('Failed to fetch popular products:', err);
            }
        };
        fetchPopular();
    }, [userCounty]);


return (
  <div className="homepage">
    <div className="container">
    <SearchBar />
    <section className='hero-section'>
        <h1>Welcome to the Buy & Sell Marketplace</h1>
        <p>Find great deals near you or post your own items for sale!</p>
    </section>
    <section className='categories-section'>
        < Collections />
    </section>

    {popularProducts.length > 0 && (
        <section className='popular-section'>
            <h2>Popular In {userCounty}</h2>
            <div className="product-grid">
                {popularProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </section>
    )}
    </div>
</div>
);



};

export default HomePage