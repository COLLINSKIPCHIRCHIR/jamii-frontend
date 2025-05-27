import {BrowserRouter,Routes,Route} from "react-router-dom";
import HomePage from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import PostAd from "./pages/PostAd";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar/Navbar";
import CategoryPage from "./components/Categories/Categories";
import SearchResults from "./components/SearchResults";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Chats from "./pages/Chats";
import Footer from "./components/Footer/Footer";

function App() {
   return (
<div>

<GoogleOAuthProvider clientId= {import.meta.env.VITE_GOOGLE_CLIENT_ID }>
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/post-ad" element={<PostAd />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/*Dynamic category route*/}
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/edit-ad/:adId" element={<PostAd />} />
        <Route path="/chats" element={<Chats />} />
      </Routes>
    <Footer />
    </BrowserRouter>
</GoogleOAuthProvider>
    </div>
  )
}

export default App
