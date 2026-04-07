'use client';

import { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  const [govBannerOpen, setGovBannerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ===== US Government Banner ===== */}
      <div className="bg-[#1a1a1a] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px]">🇺🇸</span>
              <span>An official website of the United States government</span>
            </div>
            <button
              onClick={() => setGovBannerOpen(!govBannerOpen)}
              className="text-[#a9aeb1] hover:text-white underline flex items-center gap-1"
            >
              Here&#39;s how you know
              <svg
                className={`w-3 h-3 transition-transform ${govBannerOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {govBannerOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 border-t border-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center text-lg">
                  🏛️
                </div>
                <div>
                  <p className="font-bold">Official websites use .gov</p>
                  <p className="text-[#a9aeb1] mt-1">
                    A <strong>.gov</strong> website belongs to an official government organization in the United States.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded flex-shrink-0 flex items-center justify-center text-lg">
                  🔒
                </div>
                <div>
                  <p className="font-bold">Secure .gov websites use HTTPS</p>
                  <p className="text-[#a9aeb1] mt-1">
                    A <strong>lock</strong> or <strong>https://</strong> means you&#39;ve safely connected to the .gov website.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Header / Navigation ===== */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="text-[#1a2e5a]">
                <svg className="w-8 h-8" viewBox="0 0 32 32" fill="currentColor">
                  <circle cx="16" cy="10" r="4" />
                  <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                  <path d="M22 8c2-2 6-1 6 2s-4 4-6 2" opacity="0.6" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-bold text-[#1a2e5a] tracking-tight">
                Peace Corps
              </span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6">
              {['Volunteer', 'Countries', 'About', 'Stories', 'Events', 'Donate'].map((item) => (
                <a
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-[#1a2e5a] font-medium text-sm hover:text-[#cf4a31] transition-colors"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <button className="text-[#1a2e5a] hover:text-[#cf4a31] transition-colors" aria-label="Search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Apply Button */}
              <a
                href="/apply"
                className="hidden sm:inline-block bg-[#cf4a31] text-white px-5 py-2 rounded font-bold text-sm hover:bg-[#b5382a] transition-colors"
              >
                Apply
              </a>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden text-[#1a2e5a]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t pb-4">
              <nav className="flex flex-col gap-1 pt-2">
                {['Volunteer', 'Countries', 'About', 'Stories', 'Events', 'Donate'].map((item) => (
                  <a
                    key={item}
                    href={`/${item.toLowerCase()}`}
                    className="text-[#1a2e5a] font-medium py-2 px-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    {item}
                  </a>
                ))}
                <a
                  href="/apply"
                  className="sm:hidden bg-[#cf4a31] text-white text-center py-2 px-4 rounded font-bold mt-2 hover:bg-[#b5382a] transition-colors"
                >
                  Apply
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* ===== Hero Section ===== */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=80"
          alt="Volunteers working together in a community abroad"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1d3d]/85 via-[#1a2e5a]/70 to-[#1a2e5a]/40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Make the Most of Your World
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
              Volunteer with the Peace Corps and make a lasting difference while gaining skills that last a lifetime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/apply"
                className="bg-[#cf4a31] text-white px-8 py-3 rounded font-bold text-lg hover:bg-[#b5382a] transition-colors text-center"
              >
                Apply Now
              </a>
              <a
                href="/about"
                className="border-2 border-white text-white px-8 py-3 rounded font-bold text-lg hover:bg-white hover:text-[#1a2e5a] transition-colors text-center"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Programs Section ===== */}
      <section className="py-16 md:py-24 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e5a] text-center mb-4">
            Our Programs
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Find the right way to serve with the Peace Corps.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-48 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80"
                  alt="Volunteers teaching children in a classroom abroad"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1a2e5a] mb-2 group-hover:text-[#cf4a31] transition-colors">
                  Volunteer Abroad
                </h3>
                <p className="text-gray-600 mb-4">
                  Serve for two years in a community overseas. Immerse yourself in a new culture while building capacity and making a lasting impact.
                </p>
                <a href="/volunteer" className="text-[#cf4a31] font-semibold hover:underline inline-flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-48 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80"
                  alt="Healthcare professional working with community members"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1a2e5a] mb-2 group-hover:text-[#cf4a31] transition-colors">
                  Peace Corps Response
                </h3>
                <p className="text-gray-600 mb-4">
                  Short-term, high-impact assignments for experienced professionals. Apply your expertise where it&#39;s needed most, typically 3-12 months.
                </p>
                <a href="/response" className="text-[#cf4a31] font-semibold hover:underline inline-flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="h-48 relative overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80"
                  alt="Person working on laptop connecting virtually with global teams"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#1a2e5a] mb-2 group-hover:text-[#cf4a31] transition-colors">
                  Virtual Service Pilot
                </h3>
                <p className="text-gray-600 mb-4">
                  Contribute your skills remotely through virtual volunteering opportunities. Support communities around the world from wherever you are.
                </p>
                <a href="/virtual" className="text-[#cf4a31] font-semibold hover:underline inline-flex items-center gap-1">
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Impact Stats Bar ===== */}
      <section className="bg-[#1a2e5a] py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '140+', label: 'Countries Served' },
              { number: '240,000+', label: 'Volunteers Since 1961' },
              { number: '56', label: 'Current Countries' },
              { number: '6', label: 'Sectors of Service' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm md:text-base text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Stories Section ===== */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e5a] text-center mb-4">
            Volunteer Stories
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Hear from Volunteers about their experiences serving around the world.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                country: 'Ghana',
                title: 'Building Bridges Through Education',
                excerpt: 'Teaching in a rural community taught me more than I ever expected. The connections I made will last a lifetime.',
                image: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=600&q=80',
                imageAlt: 'Children learning in a classroom in West Africa',
              },
              {
                country: 'Colombia',
                title: 'Empowering Communities Through Health',
                excerpt: 'Working alongside local health workers, we developed programs that continue to impact families across the region.',
                image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=80',
                imageAlt: 'Community health outreach in South America',
              },
              {
                country: 'Thailand',
                title: 'Youth Development in Action',
                excerpt: 'Coaching young leaders gave me a new perspective on resilience and the power of community-driven change.',
                image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=600&q=80',
                imageAlt: 'Youth leadership activities in Southeast Asia',
              },
            ].map((story) => (
              <div key={story.title} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.imageAlt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-3 bg-white/90 text-[#1a2e5a] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    {story.country}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#1a2e5a] mb-2 group-hover:text-[#cf4a31] transition-colors">
                    {story.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{story.excerpt}</p>
                  <a href="/stories" className="text-[#cf4a31] font-semibold text-sm hover:underline inline-flex items-center gap-1">
                    Read More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Where We Work ===== */}
      <section className="py-16 md:py-24 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e5a] text-center mb-4">
            Where We Work
          </h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Peace Corps Volunteers serve in communities across the globe. Explore our regions.
          </p>

          {/* Map image */}
          <div className="rounded-xl h-64 md:h-96 mb-10 relative overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80"
              alt="World map showing Peace Corps service regions"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e5a]/60 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-2xl font-bold">56 Countries</p>
              <p className="text-sm opacity-80">Explore where Peace Corps Volunteers serve</p>
            </div>
          </div>

          {/* Region Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            {['Africa', 'Asia', 'Caribbean', 'Central America', 'South America', 'Europe', 'Pacific Islands'].map(
              (region) => (
                <button
                  key={region}
                  className="bg-[#1a2e5a] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#cf4a31] transition-colors"
                >
                  {region}
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===== Apply CTA Section ===== */}
      <section className="relative py-20 md:py-28">
        <img
          src="https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=1920&q=80"
          alt="Volunteers celebrating together"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#cf4a31]/90 to-[#1a2e5a]/90" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">
            Your journey starts here. Apply to become a Peace Corps Volunteer and change the world — starting with yourself.
          </p>
          <a
            href="/apply"
            className="inline-block bg-white text-[#cf4a31] px-10 py-4 rounded font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Apply Now
          </a>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0f1d3d] text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-7 h-7 text-white" viewBox="0 0 32 32" fill="currentColor">
                  <circle cx="16" cy="10" r="4" />
                  <path d="M8 26c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                  <path d="M22 8c2-2 6-1 6 2s-4 4-6 2" opacity="0.6" />
                </svg>
                <span className="text-xl font-bold tracking-tight">Peace Corps</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                The Peace Corps sends Americans with a passion for service abroad on behalf of the United States to work with communities and create lasting change.
              </p>
            </div>

            {/* About Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-gray-300">About</h4>
              <ul className="space-y-2">
                {['Mission', 'Leadership', 'History', 'Open Government', 'Budget & Performance'].map((link) => (
                  <li key={link}>
                    <a href="/about" className="text-gray-400 text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Volunteer Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-gray-300">Volunteer</h4>
              <ul className="space-y-2">
                {['Is It Right for Me?', 'What Volunteers Do', 'Benefits', 'Medical', 'FAQs'].map((link) => (
                  <li key={link}>
                    <a href="/volunteer" className="text-gray-400 text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4 text-gray-300">Resources</h4>
              <ul className="space-y-2">
                {['Newsroom', 'Educators', 'Returned Volunteers', 'Partnerships', 'Contact Us'].map((link) => (
                  <li key={link}>
                    <a href="/resources" className="text-gray-400 text-sm hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 mb-8">
            {['Facebook', 'Twitter', 'Instagram', 'YouTube', 'LinkedIn'].map((social) => (
              <a
                key={social}
                href={`https://${social.toLowerCase()}.com/peacecorps`}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition-colors"
                aria-label={social}
              >
                <span className="text-xs font-bold">{social[0]}</span>
              </a>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 text-xs mb-4">An official website of the United States government</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>&copy; {new Date().getFullYear()} Peace Corps</span>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/foia" className="hover:text-white transition-colors">FOIA</a>
              <a href="/accessibility" className="hover:text-white transition-colors">Accessibility</a>
              <a href="/no-fear-act" className="hover:text-white transition-colors">No FEAR Act</a>
              <a href="/inspector-general" className="hover:text-white transition-colors">Office of Inspector General</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </>
  );
}
