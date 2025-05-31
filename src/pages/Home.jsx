import React ,{useState, useEffect} from 'react'
import api from '../services/api'
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar/SearchBar';
import Categories from '../components/Categories/Categories';
import axios from 'axios';
import Collections from '../components/collections/Collections';
import './Home.css'

function HomePage() {
  
return (
  <div className="homepage">
    <SearchBar />
    <section className='hero-section'>
        <h1>Welcome to the Buy & Sell Marketplace</h1>
        <p>Find great deals near you or post your own items for sale!</p>
    </section>
    <section className='categories-section'>
        < Collections />
    </section>
    </div>
);



};

export default HomePage