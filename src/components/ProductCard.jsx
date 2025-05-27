import { useNavigate } from 'react-router-dom';
import './productCard.css';

const ProductCard = ({_id, name, price ,location, images}) => {

  const navigate = useNavigate();
  const image = images && images.length > 0 ? `http://localhost:5000${images[0]} ` : '';

  const handleClick = () => {
    navigate(`/product/${_id}`)
  };

  return (
    <div className='product-card' onClick={handleClick}>
      <img src={image} alt={name} className='product-image' />
      <div className="product-info">
        <h3>{name}</h3>
        <p>Price: Ksh {price}</p>
        <p>Location: {location}</p>
      </div>
    </div>
  )
}

export default ProductCard