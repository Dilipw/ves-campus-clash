import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import LandingPage from "../pages/LandingPage";
import RegisterPage from "../pages/RegisterPage";
import GamePage from "../pages/GamePage";
import ResultPage from "../pages/ResultPage";

export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Parent Layout wrapper */}
                <Route element={<Layout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/game" element={<GamePage />} />
                    <Route path="/result" element={<ResultPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}