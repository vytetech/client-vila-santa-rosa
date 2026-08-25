import { useEffect } from 'react'
import { useLocation } from 'react-router'
import Navbar from '@/sections/Navbar'
import Hero from '@/sections/Hero'
import About from '@/sections/About'
import Rooms from '@/sections/Rooms'
import Booking from '@/sections/Booking'
import Amenities from '@/sections/Amenities'
import Location from '@/sections/Location'
import Rules from '@/sections/Rules'
import Faq from '@/sections/Faq'
import Gallery from '@/sections/Gallery'
import Garden from '@/sections/Garden'
import Breakfast from '@/sections/Breakfast'
import Tours from '@/sections/Tours'
import Testimonials from '@/sections/Testimonials'
import Contact from '@/sections/Contact'
import Footer from '@/sections/Footer'
import SeoContent from '@/sections/SeoContent'

export default function Home() {
  const { hash } = useLocation()

  // Deep links like /#reservas scroll straight to the section
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [hash])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Rooms />
        <Booking />
        <Amenities />
        <Rules />
        <Garden />
        <Gallery />
        <Breakfast />
        <Location />
        <SeoContent />
        <Tours />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
