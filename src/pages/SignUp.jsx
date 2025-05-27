import react, { useState } from 'react';
import api from '../services/api';
import './signUp.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  console.log('SignUp: Google Client ID:',import.meta.env.VITE_GOOGLE_CLIENT_ID)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);


    try {
      const res = await api.post('/users/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      console.log('Signup: Response.data:', res.data);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.setItem('token', res.data.token);
      setMessage('Account created successfully!');
      setTimeout(() => navigate('/'), 1500); // go to home page
    } catch (err){
      console.error('Signup error:',err.response?.data);
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    try {
      const res = await api.post('/users/google-login', { token: credentialResponse.credential });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setMessage('Google sign-up successful!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error('Google signup error:', err.response?.data);
      setError(err.response?.data?.message || 'Google sign-up failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Account</h2>
      {message && <p className='success'>{message}</p>}
      {error && <p className='error'>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
        type='text'
        name ='name'
        placeholder='Name'
        value={formData.name}
        onChange={handleChange}
        required
        aria-label='Full Name'
        />
        <input
        type='email'
        name='email'
        placeholder='Email Address'
        value={formData.email}
        onChange={handleChange}
        required
        aria-label='Email Address'
        />
        <div className="password-field">
        <input
        type={showPassword ? 'text' : 'password'}
        name='password'
        placeholder='Password'
        value={formData.password}
        onChange={handleChange}
        required
        aria-label='Password'
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='toggle-password'
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
        </div>
        <button 
          type="submit" 
          disabled={!formData.name || !formData.email || !formData.password}
        >
          {isLoading ? <span> <span className='spinner'></span>Signing Up...</span> : 'Sign Up'}
        </button>

      </form>
      <div className="social-login">
        <p>Or sign up with</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google sign-up failed')}
          theme= "filled_blue"
          size="large"
        />
      </div>
      <p className="login-link">
        Already have an account? <a href='/login'>Log in</a>
      </p>
    </div>
  );
};

export default SignUp