import { Outlet } from "react-router-dom";
import Navbar from "./landing/Navbar"; 
import Footer from "./landing/Footer"; 

export default function Layout() {
  return (
    <div className="min-h-screen bg-ink text-text-hi flex flex-col justify-between font-body">
      <Navbar />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}