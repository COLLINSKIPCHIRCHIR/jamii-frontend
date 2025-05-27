import { useState, useEffect, useRef } from 'react'
import './Navbar.css'
import { Link, useNavigate } from 'react-router-dom';
import { FaHome } from 'react-icons/fa'
import { FiLogIn, FiUserPlus, FiPlusCircle, FiX, FiMenu, FiSettings, FiLogOut, FiSun , FiMoon, FiBell} from 'react-icons/fi'
import api from '../../services/api'


const Navbar = () => {

   
    const [ user, setUser ]=useState(null);
    const [dropdownOpen, setDropdownOpen ] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light')
    const [unreadCount, setUnreadCount] = useState(0);
    
    
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

//apply theme to document
useEffect(()=> {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}, [theme]) ;   

//load user from localStorage
    useEffect (() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        console.log('Navbar: Loaded user from localStorage:' , storedUser);
        if (storedUser) {
            console.log("User name from localStorage:", storedUser.name);
            console.log("User profile pic from localStorage:", storedUser.profilepic);
            setUser(storedUser)

        //if name missing ,fetch user details from backend
        if (!storedUser.name) {
            const fetchUserDetails = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;

                    const response = await api.get('/user/profile', {
                        headers: { Authorization: `Bearer ${token}`}
                    })

                    const updatedUser = { ...storedUser, ...response.data };
                    console.log('Fetched user details:' , updatedUser);
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser))
                } catch (err) {
                    console.error('Failed to fetch user details:' , err);
                }
            }
            fetchUserDetails();
        }
        }
    }, []);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await api.get('/chat/unread/count', {
                    headers: { Authorization: `Bearer ${token}`},
                });

                setUnreadCount(response.data.unreadCount || 0);
            } catch (err) {
                console.error('Failed to fetch unread count:', err);
            }
        }

        if (user) {
            fetchUnreadCount();
            //refresh every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    //debug user state changes
    useEffect (()=> {
        console.log('Navbar: Current user state:', user)
    }, [user]);

//handle outside clicks to close earch results or dropdown
useEffect(() => {
    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)){
            console.log("clicked outside dropdown, closing...");
            setDropdownOpen(false);
        }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        navigate('/login')
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    }

    const buildImg = (file) => {
        if (!file || file.trim() === "") return null;
        if (file.startsWith("http")) return file;
        if (file.startsWith("/uploads")) return `http://localhost:5000${file}`;
        return `http://localhost:5000/uploads/${file}`;
    }


  return (
    <nav className='navbar'>
        <div className="navbar-left" onClick={() => navigate('/')} role='button' tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate ('/')} style={{cursor: 'pointer'}}>
            <FaHome className='home-icon' />
            <h2>JAMII MARKET</h2>
        </div>
        
        <div className= 'navbar-right'>
            <button
                className='theme-toggle'
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
                {theme === 'light' ? <FiMoon /> : <FiSun />}
            </button>
            {user && (
                <div
                    className="notification-icon"
                    role="button"
                    onClick={() => navigate('/chats')}
                    title="Go to chats page"
                >
                    <FiBell size={22} />
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount}
                        </span>
                    )}
                </div>
            )}


            <button
                className='mobile-toggle'
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>

            <div className={`nav-links ${mobileMenuOpen ? 'show' : ''}`} >
                <button className="nav-button post-ad-button" onClick={() => navigate('/post-ad')}>
                    <FiPlusCircle /> Post Item
                </button>

                {!user ? (
                    <>
                        <button className="nav-button login-button" onClick={() => navigate('/login')}>
                            <FiLogIn /> Login
                        </button>
                        <button className="nav-button signup-button" onClick={() => navigate('/signup')}>
                            <FiUserPlus /> Signup
                        </button>

                    </>

                ) : (
                        <div className="profile-area"  ref={dropdownRef}>
                            <div 
                                className='profile-toggle'
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                role='button'
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && setDropdownOpen(!dropdownOpen)}
                                aria-label='Toggle profile menu'
                            >
                            {user?.profilepic && buildImg(user.profilepic) ? (
                                <img
                                src={ buildImg(user.profilepic)}
                                alt='profile'
                                className='navbar-profile-pic'
                                />
                            ): (
                                <div className='profile-placeholder'>{user?.name?.trim() ? user.name.charAt(0)?.toUpperCase() : 'U'} </div>
                            )}

                            <span className='username'>{user?.name?.trim() ?   user.name : 'User'}</span>
                            </div>
                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    <div 
                                        onClick={() => { 
                                            navigate('/dashboard');
                                            setDropdownOpen(false);
                                        }}
                                        role='button'
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && navigate('/dashboard') && setDropdownOpen(false)}
                                    >
                                        <FiSettings /> Dashboard
                                    </div>
                                    <div 
                                        onClick={handleLogout}
                                        role='button'
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogout()} 
                                    > 
                                        <FiLogOut /> Logout  
                                    </div>
                                </div>
                            )}
                        </div>

                )}
                
        </div>
        </div>
    </nav>
  )
}

export default Navbar