import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/home";
import Produto from "../pages/client/produto";

function Routers() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/produto/:id" element={<Produto />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Routers;
