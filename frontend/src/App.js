import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Call from './components/Call';
import Home from './components/Home';
function App() {
  return (
    <BrowserRouter>
    <Routes>
    <Route path="/" element={<Home></Home>}></Route>
    <Route path='/call' element={<Call></Call>}></Route>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
