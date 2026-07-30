import "../styles/tokens.css";
import Navbar from "../components/landing/Navbar";
import HeroSection from "../components/landing/HeroSection";
import HowItWorks from "../components/landing/HowItWorks";
import FollowSection from "../components/landing/FollowSection";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-ink font-body">
            <HeroSection />
            <HowItWorks />
            <FollowSection />
        </main>
    );
}
