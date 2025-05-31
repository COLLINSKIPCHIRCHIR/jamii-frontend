import { useNavigate } from 'react-router-dom';
import './productCard.css';


const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProductCard = ({ _id, name, price, location, images }) => {
  const navigate = useNavigate();

  const image = images && images.length > 0
    ? images[0].startsWith('http')
      ? images[0]
      : `${baseURL}${images[0]}`
    : 'https://placehold.co/300x200?text=No+Image';

  const handleClick = () => {
    navigate(`/product/${_id}`);
  };

  return (
    <div className="product-card" onClick={handleClick}>
      <img src={image} alt={name} className="product-image" />
      <div className="product-info">
        <h3>{name}</h3>
        <p>Price: Ksh {price}</p>
        <p>Location: {location}</p>
      </div>
    </div>
  );
};

export default ProductCard;
