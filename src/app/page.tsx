'use client';

import { useState } from 'react';
import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  const [govBannerOpen, setGovBannerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const NAV_ITEMS = [
    {
      label: 'Ways to Serve',
      href: '/ways-to-serve',
      children: [
        { label: 'Peace Corps Volunteer', href: '/ways-to-serve/serve-with-us/peace-corps-volunteer/' },
        { label: 'Peace Corps Response', href: '/ways-to-serve/serve-with-us/peace-corps-response/' },
        { label: 'Virtual Service Pilot', href: '/ways-to-serve/serve-with-us/virtual-service-pilot/' },
        { label: 'Browse Opportunities', href: '/ways-to-serve/service-assignments/browse-opportunities/' },
      ],
    },
    {
      label: 'What We Do',
      href: '/what-we-do',
      children: [
        { label: 'Where We Serve', href: '/what-we-do/where-we-serve/' },
        { label: 'Our Impact', href: '/what-we-do/our-impact/' },
        { label: 'Tech Corps', href: '/what-we-do/tech-corps/' },
      ],
    },
    {
      label: 'About the Agency',
      href: '/about-the-agency',
      children: [
        { label: 'Leadership', href: '/about-the-agency/leadership/' },
        { label: 'News', href: '/about-the-agency/media-center/news/' },
        { label: 'Contact Us', href: '/about-the-agency/contact-us/' },
        { label: 'Budget & Performance', href: '/about-the-agency/policies-and-publications/budget-and-performance/' },
      ],
    },
  ];

  return (
    <>
      {/* ===== USWDS-style Government Banner ===== */}
      <section className="bg-[#f0f0f0]" aria-label="Official government website">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-2 py-1 text-[13px] text-[#1b1b1b]">
            <img src="https://designsystem.digital.gov/img/us_flag_small.png" alt="U.S. flag" className="w-4 h-[11px]" />
            <span className="font-normal">An official website of the United States government</span>
            <button
              onClick={() => setGovBannerOpen(!govBannerOpen)}
              className="ml-1 text-[#005ea2] hover:text-[#1a4480] underline text-[13px] flex items-center gap-0.5"
            >
              Here&rsquo;s how you know
              <svg className={`w-3.5 h-3.5 transition-transform ${govBannerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          {govBannerOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-3 pb-4 text-[13px] text-[#1b1b1b]">
              <div className="flex gap-3">
                <svg className="w-10 h-10 text-[#005ea2] shrink-0" viewBox="0 0 40 40" fill="currentColor"><path d="M20 2L2 14h4v22h28V14h4L20 2zm0 4.5L32 14v18H8V14l12-7.5z"/><rect x="14" y="20" width="5" height="8"/><rect x="21" y="20" width="5" height="8"/></svg>
                <p><strong>Official websites use .gov</strong><br />A <strong>.gov</strong> website belongs to an official government organization in the United States.</p>
              </div>
              <div className="flex gap-3">
                <svg className="w-10 h-10 text-[#005ea2] shrink-0" viewBox="0 0 40 40" fill="currentColor"><path d="M26 16v-4a6 6 0 10-12 0v4H10v16h20V16h-4zm-10-4a4 4 0 118 0v4h-8v-4zm12 18H12V18h16v12z"/><circle cx="20" cy="24" r="2"/></svg>
                <p><strong>Secure .gov websites use HTTPS</strong><br />A <strong>lock</strong> (<svg className="inline w-3 h-3" viewBox="0 0 16 16" fill="currentColor"><path d="M12 7V5a4 4 0 00-8 0v2H2v7h12V7h-2zm-6-2a2 2 0 114 0v2H6V5z"/></svg>) or <strong>https://</strong> means you&rsquo;ve safely connected to the .gov website.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== Header ===== */}
      <header className="bg-white sticky top-0 z-50 shadow-sm">
        {/* Top thin red/blue stripe */}
        <div className="h-1 bg-gradient-to-r from-[#1a2e5a] via-[#1a2e5a] to-[#cf4a31]" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <a href="/" className="flex items-center gap-3 shrink-0">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-[#1a2e5a] flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-7 h-7 text-[#cf4a31]" fill="currentColor">
                    <path d="M20 6c-1 0-2 .5-3 1.5C14 10 8 14 8 22c0 5 3 8 6 10l2-3c-2-1-4-4-4-7 0-5 4-8 8-12 4 4 8 7 8 12 0 3-2 6-4 7l2 3c3-2 6-5 6-10 0-8-6-12-9-14.5-1-1-2-1.5-3-1.5z"/>
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-[22px] font-bold text-[#1a2e5a] leading-tight tracking-tight" style={{ fontFamily: 'Merriweather, serif' }}>
                  Peace Corps
                </div>
              </div>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <a
                    href={item.href}
                    className={`px-4 py-2 text-[15px] font-semibold rounded-md transition-colors ${
                      activeDropdown === item.label ? 'text-[#cf4a31] bg-gray-50' : 'text-[#1a2e5a] hover:text-[#cf4a31]'
                    }`}
                  >
                    {item.label}
                    {item.children && (
                      <svg className="inline w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </a>
                  {item.children && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 mt-0 py-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
                      {item.children.map((child) => (
                        <a key={child.label} href={child.href} className="block px-4 py-2.5 text-sm text-[#1a2e5a] hover:bg-[#f0f0f0] hover:text-[#cf4a31] transition-colors">
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#1a2e5a] hover:bg-gray-100 transition" aria-label="Search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {/* Support Button - Glowing */}
              <a href="/tickets" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all pc-glow-btn">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Support
              </a>

              {/* Serve Button */}
              <a href="/ways-to-serve" className="hidden sm:inline-block bg-[#cf4a31] text-white px-6 py-2.5 rounded-md font-bold text-sm hover:bg-[#b5382a] transition-colors shadow-sm">
                Serve with Us
              </a>

              {/* Mobile Menu */}
              <button
                className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-[#1a2e5a] hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  <a href={item.href} className="block py-2 px-3 text-[#1a2e5a] font-semibold text-base hover:bg-gray-50 rounded">{item.label}</a>
                  {item.children && (
                    <div className="pl-6 space-y-0.5">
                      {item.children.map((child) => (
                        <a key={child.label} href={child.href} className="block py-1.5 px-3 text-sm text-gray-600 hover:text-[#cf4a31]">{child.label}</a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 px-3 space-y-2">
                <a href="/tickets" className="flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm text-white pc-glow-btn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  Support
                </a>
                <a href="/ways-to-serve" className="block text-center bg-[#cf4a31] text-white py-2.5 rounded-md font-bold hover:bg-[#b5382a]">Serve with Us</a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ===== Main Content ===== */}
      <main id="main-content">
        {/* Hero */}
        <section className="relative min-h-[560px] md:min-h-[640px] flex items-center overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1920&q=80"
            alt="Peace Corps Volunteers working with community members abroad"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1d3d]/90 via-[#1a2e5a]/75 to-transparent" />
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 py-20">
            <div className="max-w-xl">
              <p className="text-[#f9a825] font-semibold text-sm uppercase tracking-widest mb-4">Make a Difference</p>
              <h1 className="text-4xl md:text-[52px] font-bold text-white leading-[1.1] mb-6" style={{ fontFamily: 'Merriweather, serif' }}>
                Make the Most<br />of Your World
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-lg">
                Volunteer with the Peace Corps and create lasting change while gaining the experience of a lifetime.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="/ways-to-serve" className="inline-flex items-center justify-center bg-[#cf4a31] text-white px-8 py-3.5 rounded-md font-bold text-base hover:bg-[#b5382a] transition-all shadow-lg hover:shadow-xl">
                  Serve with Us
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </a>
                <a href="/what-we-do" className="inline-flex items-center justify-center border-2 border-white/80 text-white px-8 py-3.5 rounded-md font-bold text-base hover:bg-white hover:text-[#1a2e5a] transition-all">
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Bar */}
        <section className="bg-white border-b">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
              {[
                { icon: '🌍', label: 'Where We Serve', sub: '56+ countries worldwide', href: '/what-we-do/where-we-serve/' },
                { icon: '📋', label: 'Browse Opportunities', sub: 'Find your assignment', href: '/ways-to-serve/service-assignments/browse-opportunities/' },
                { icon: '📞', label: 'Contact a Recruiter', sub: 'Get your questions answered', href: '/about-the-agency/contact-us/' },
                { icon: '📰', label: 'Latest News', sub: 'Agency updates & stories', href: '/about-the-agency/media-center/news/' },
              ].map((link) => (
                <a key={link.label} href={link.href} className="flex items-center gap-3 px-5 py-5 hover:bg-[#f0f0f0] transition group">
                  <span className="text-2xl">{link.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-[#1a2e5a] group-hover:text-[#cf4a31] transition-colors">{link.label}</div>
                    <div className="text-xs text-gray-500">{link.sub}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Ways to Serve */}
        <section className="py-20 bg-[#fafafa]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <p className="text-[#cf4a31] font-semibold text-sm uppercase tracking-widest mb-3">Ways to Serve</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e5a]" style={{ fontFamily: 'Merriweather, serif' }}>
                Find Your Path to Service
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-lg">
                Whether you want to serve abroad, respond to urgent needs, or volunteer from home — there&rsquo;s a program for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Peace Corps Volunteer',
                  desc: 'Live and work alongside community members on locally prioritized projects for two years. Receive a living allowance, housing, medical care, and training.',
                  img: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80',
                  alt: 'Volunteers teaching children',
                  tag: '2-Year Service',
                  href: '/ways-to-serve/serve-with-us/peace-corps-volunteer/',
                },
                {
                  title: 'Peace Corps Response',
                  desc: 'Short-term, high-impact assignments for experienced professionals. Apply your expertise where it\'s needed most for 3-12 months.',
                  img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
                  alt: 'Healthcare professional with community',
                  tag: '3-12 Months',
                  href: '/ways-to-serve/serve-with-us/peace-corps-response/',
                },
                {
                  title: 'Virtual Service Pilot',
                  desc: 'Collaborate virtually for 3-6 months, donating your skills to support grassroots efforts globally — without relocating.',
                  img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
                  alt: 'Remote volunteering on laptop',
                  tag: 'Remote',
                  href: '/ways-to-serve/serve-with-us/virtual-service-pilot/',
                },
              ].map((card) => (
                <a key={card.title} href={card.href} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
                  <div className="relative h-52 overflow-hidden">
                    <img src={card.img} alt={card.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-3 left-3 bg-[#1a2e5a] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">{card.tag}</span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a2e5a] mb-2 group-hover:text-[#cf4a31] transition-colors" style={{ fontFamily: 'Merriweather, serif' }}>{card.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{card.desc}</p>
                    <span className="text-[#cf4a31] font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                      Learn more
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="bg-[#1a2e5a] py-16">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: '140+', label: 'Countries Served' },
                { number: '240,000+', label: 'Volunteers Since 1961' },
                { number: '56', label: 'Current Countries' },
                { number: '6', label: 'Sectors of Service' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>{stat.number}</div>
                  <div className="text-sm text-gray-300 uppercase tracking-wider font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stories */}
        <section className="py-20 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[#cf4a31] font-semibold text-sm uppercase tracking-widest mb-3">From the Field</p>
                <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e5a]" style={{ fontFamily: 'Merriweather, serif' }}>Volunteer Stories</h2>
              </div>
              <a href="/about-the-agency/media-center/news/" className="hidden md:inline-flex items-center gap-1 text-[#cf4a31] font-semibold text-sm hover:underline">
                View all stories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { country: 'Ghana', region: 'Africa', title: 'Building Bridges Through Education', excerpt: 'Teaching in a rural community taught me more than I ever expected. The connections I made will last a lifetime.', img: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=600&q=80', alt: 'Children in West Africa classroom' },
                { country: 'Colombia', region: 'South America', title: 'Empowering Communities Through Health', excerpt: 'Working alongside local health workers, we developed programs that continue to impact families across the region.', img: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=600&q=80', alt: 'Community health outreach' },
                { country: 'Thailand', region: 'Asia', title: 'Youth Development in Action', excerpt: 'Coaching young leaders gave me a new perspective on resilience and the power of community-driven change.', img: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=600&q=80', alt: 'Youth activities in Southeast Asia' },
              ].map((story) => (
                <article key={story.title} className="group cursor-pointer">
                  <div className="relative h-56 rounded-xl overflow-hidden mb-4">
                    <img src={story.img} alt={story.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="bg-white/90 text-[#1a2e5a] text-[11px] font-bold px-2.5 py-1 rounded-full">{story.country}</span>
                      <span className="bg-[#1a2e5a]/80 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">{story.region}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#1a2e5a] mb-2 group-hover:text-[#cf4a31] transition-colors" style={{ fontFamily: 'Merriweather, serif' }}>{story.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{story.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Where We Serve */}
        <section className="py-20 bg-[#fafafa]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-12">
              <p className="text-[#cf4a31] font-semibold text-sm uppercase tracking-widest mb-3">Where We Serve</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1a2e5a]" style={{ fontFamily: 'Merriweather, serif' }}>Explore Our Regions</h2>
            </div>

            <div className="relative rounded-2xl overflow-hidden shadow-lg mb-10">
              <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1400&q=80" alt="World map" className="w-full h-64 md:h-96 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e5a]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-white text-2xl font-bold" style={{ fontFamily: 'Merriweather, serif' }}>56 Countries</p>
                <p className="text-white/80 text-sm mt-1">Volunteers serve in communities across the globe</p>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {['Africa', 'Asia', 'Caribbean', 'Central America', 'South America', 'Europe', 'Pacific Islands'].map((region) => (
                <button key={region} className="bg-white text-[#1a2e5a] border border-gray-200 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#1a2e5a] hover:text-white hover:border-[#1a2e5a] transition-all shadow-sm">
                  {region}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24 overflow-hidden">
          <img src="https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=1920&q=80" alt="Volunteers celebrating" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#cf4a31]/90 to-[#1a2e5a]/90" />
          <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Merriweather, serif' }}>Ready to Make a Difference?</h2>
            <p className="text-white/90 text-lg max-w-xl mx-auto mb-8">Your journey starts here. Serve with the Peace Corps and change the world — starting with yourself.</p>
            <a href="/ways-to-serve" className="inline-flex items-center gap-2 bg-white text-[#cf4a31] px-10 py-4 rounded-md font-bold text-lg hover:bg-gray-100 transition shadow-lg">
              Serve with Us
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </a>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0f1d3d] text-white">
        {/* Return to top */}
        <div className="bg-[#1a2e5a]">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="w-full py-3 text-sm font-medium text-white/80 hover:text-white transition text-center">
              Return to top ↑
            </button>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Logo */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-6 h-6 text-[#cf4a31]" fill="currentColor">
                    <path d="M20 6c-1 0-2 .5-3 1.5C14 10 8 14 8 22c0 5 3 8 6 10l2-3c-2-1-4-4-4-7 0-5 4-8 8-12 4 4 8 7 8 12 0 3-2 6-4 7l2 3c3-2 6-5 6-10 0-8-6-12-9-14.5-1-1-2-1.5-3-1.5z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold" style={{ fontFamily: 'Merriweather, serif' }}>Peace Corps</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                The Peace Corps sends Americans with a passion for service abroad to work with communities and create lasting change.
              </p>
              <p className="text-gray-500 text-xs mt-4">1-855-855-1961</p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">Ways to Serve</h4>
              <ul className="space-y-2.5 text-sm">
                {['Peace Corps Volunteer', 'Peace Corps Response', 'Virtual Service Pilot', 'Browse Opportunities'].map(l => (
                  <li key={l}><a href="/ways-to-serve" className="text-gray-400 hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">What We Do</h4>
              <ul className="space-y-2.5 text-sm">
                {['Where We Serve', 'Our Impact', 'Tech Corps', 'Sectors'].map(l => (
                  <li key={l}><a href="/what-we-do" className="text-gray-400 hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4">About</h4>
              <ul className="space-y-2.5 text-sm">
                {['Leadership', 'News', 'Contact Us', 'Budget & Performance', 'Policies'].map(l => (
                  <li key={l}><a href="/about-the-agency" className="text-gray-400 hover:text-white transition">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Social */}
          <div className="flex gap-3 mb-8">
            {['Facebook', 'X', 'Instagram', 'YouTube', 'LinkedIn'].map((s) => (
              <a key={s} href={`https://${s.toLowerCase()}.com/peacecorps`} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:bg-white/20 hover:text-white transition text-xs font-bold" aria-label={s}>
                {s[0]}
              </a>
            ))}
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-6">
            <p className="text-gray-500 text-xs mb-3">An official website of the United States government</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
              <span>&copy; {new Date().getFullYear()} Peace Corps</span>
              <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
              <a href="/foia" className="hover:text-white transition">FOIA</a>
              <a href="/accessibility" className="hover:text-white transition">Accessibility</a>
              <a href="/no-fear-act" className="hover:text-white transition">No FEAR Act</a>
              <a href="/inspector-general" className="hover:text-white transition">Office of Inspector General</a>
              <a href="/usa-gov" className="hover:text-white transition">USA.gov</a>
            </div>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </>
  );
}
