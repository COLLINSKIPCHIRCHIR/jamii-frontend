import React from 'react';
import { Link } from 'react-router-dom'
import './Footer.css';
import { FaFacebook, FaTwitter , FaInstagram  } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className='footer'>
        <div className="footer-container">
            {/* logo and description */}
            <div className="footer-section">
                <h2 className='footer-logo'>JAMII MARKET</h2>
                <p className="footer-description">
                    Your trusted platform for buying and selling in Kenya
                </p>
            </div>
            {/* navigation links*/}
            <div className="footer-section">
                <h4>Quick Links</h4>
                <ul className='footer-links'>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                    <li><Link to="/login">Login</Link></li>
                </ul>
            </div>
            {/*social media*/}
            <div className="footer-section">
                <h4>Follow Us</h4>
                <div className="footer-socials">
                    <a href="https://facebook.com" target='_blank' rel='noreferrer'><FaFacebook /></a>
                    <a href="https://x.com" target='_blank' rel='noreferrer'><FaTwitter /></a>
                    <a href="https://instagram.com" target='_blank' rel='noreferrer'><FaInstagram /></a>
                </div>
            </div>
        </div>
        <div className="footer-bottom">
            &copy; {new Date().getFullYear()} Jamii Market. All rights reserved. 
        </div>

    </footer>
  )
}

export default Footer;