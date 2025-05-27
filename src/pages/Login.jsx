import React, {useState} from 'react'
import api from '../services/api'
import './login.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('');
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  console.log('Login: Google Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID );

  const  handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await api.post('/users/login', {email, password});
      console.log('Login: Response data:', res.data);

      //save token and user info to localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setMessage('Login successful!');
      //redirect to dashboard
      setTimeout(()=> navigate('/dashboard'), 1500 );

    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

const handleGoogleSuccess = async (credentialResponse) => {
  setIsLoading(true);
  try {
    const res = await api.post('/users/google-login', { token: credentialResponse.credential });
    console.log('Google Login: Response data:', res.data)
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user' , JSON.stringify(res.data.user));
    setMessage( 'Google login successful!');
    setTimeout(() => navigate('/dashboard'), 1500);
  } catch (err) {
    console.error('Google login error:', err.response?.data);
    setError(err.response?.data?.message || 'Google login failed')
  } finally {
    setIsLoading(false);
  }
}


  return (
    <div className='login-container'>
      <h2>Login to your Account</h2>
      {message && <p className='success'>{message}</p>}
      {error && <p className='error'>{error}</p>}

      <form onSubmit={handleSubmit} className='login-form'>
        <input
        type='email'
        placeholder='Email Address'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label='Email Address'
        />

        <input
        type='password'
        placeholder='Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        aria-label='Password'
        />

        <button type='submit' disabled={isLoading}>
          { isLoading ? 'Logging In...': 'Login'}
        </button>
      </form>
      <div className="social-login">
        <p>Or login with</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={()=> setError('Google login failed')}
          theme='filled_blue'
          size='large'
        />
      </div>

      <p className='signup-link'>
        Don't have an account? <a href='/signup'>Sign up</a>
      </p>

    </div>
  )
}

export default Login