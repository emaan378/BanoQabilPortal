import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  ChevronRight,
  Users,
  BookOpen,
  Award,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Star,
  MonitorPlay,
  Palette,
  TrendingUp,
  Code2,
  Globe,
  Cpu,
  Search,
  ChevronDown,
  ArrowRight,
  Clock,
  Quote,
  ClipboardList,
} from 'lucide-react';
import { contentApi } from '@/lib/api.js';
import './LandingPage.css';

const COURSE_META = [
  { match: /web/i, icon: Code2, tag: 'Most Popular' },
  { match: /graphic/i, icon: Palette, tag: 'Creative' },
  { match: /digital marketing/i, icon: TrendingUp, tag: 'High Demand' },
  { match: /video/i, icon: MonitorPlay, tag: 'Trending' },
  { match: /e-commerce|ecommerce/i, icon: Globe, tag: 'Business' },
  { match: /python/i, icon: Cpu, tag: 'Tech' },
];

const defaultCourseMeta = (name) => {
  const match = COURSE_META.find((m) => m.match.test(name));
  return match || { icon: BookOpen, tag: 'Free' };
};

const mapCourse = (course) => {
  const meta = defaultCourseMeta(course.name || '');
  return {
    ...course,
    icon: meta.icon,
    tag: meta.tag,
    title: course.name,
    duration: course.duration || 'Flexible',
  };
};

const formatCnic = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
};

const EMPTY_REGISTRATION = { name: '', cnic: '', phone: '', email: '', campus: '', course: '' };

export default function LandingPage({ navigate }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [courses, setCourses] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);

  const [regForm, setRegForm] = useState(EMPTY_REGISTRATION);
  const [regErrors, setRegErrors] = useState({});
  const [regStatus, setRegStatus] = useState('idle');
  const [regMessage, setRegMessage] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [courseRes, campusRes, testimonialRes] = await Promise.allSettled([
        contentApi.courses(),
        contentApi.campuses(),
        contentApi.testimonials(),
      ]);
      if (cancelled) return;
      if (courseRes.status === 'fulfilled') setCourses((courseRes.value.data || []).map(mapCourse));
      if (campusRes.status === 'fulfilled') setCampuses(campusRes.value.data || []);
      if (testimonialRes.status === 'fulfilled') setTestimonials(testimonialRes.value.data || []);
      setContentLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const coursesForSelectedCampus = regForm.campus
    ? courses.filter((c) => !c.campus || c.campus === regForm.campus)
    : courses;

  const validateRegistration = () => {
    const e = {};
    if (!regForm.name.trim()) e.name = 'Full name is required';
    if (!/^\d{5}-\d{7}-\d$/.test(regForm.cnic)) e.cnic = 'CNIC must be in 00000-0000000-0 format';
    if (!regForm.phone.trim()) e.phone = 'Mobile number is required';
    if (regForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) e.email = 'Invalid email address';
    if (!regForm.campus) e.campus = 'Please select a campus';
    if (!regForm.course) e.course = 'Please select a course';
    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegistration()) return;
    setRegStatus('submitting');
    setRegMessage('');
    try {
      await contentApi.register(regForm);
      setRegStatus('success');
      setRegMessage("Thanks! Your registration has been received — we'll be in touch soon.");
      setRegForm(EMPTY_REGISTRATION);
      setRegErrors({});
    } catch (error) {
      setRegStatus('error');
      setRegMessage((Array.isArray(error.details) && error.details.length) ? error.details.join(', ') : (error.message || 'Something went wrong. Please try again.'));
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', action: () => scrollTo('hero') },
    { label: 'Courses', action: () => scrollTo('courses') },
    { label: 'Admissions', action: () => scrollTo('admissions') },
    { label: 'Campus', action: () => scrollTo('campus') },
    { label: 'Verify Certificate', action: () => navigate('portal-selector') },
  ];

  return (
    <div className="LandingPage-div-1">
      {/* NAV */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="LandingPage-div-2">
          <div className="LandingPage-div-3">
            <div className="LandingPage-div-4">
              <img src="/logo.png" alt="Bano Qabil" className="LandingPage-logo-5" />
              <div>
                <span className={`font-bold text-base leading-none block ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                  Bano Qabil
                </span>
                <span className={`text-xs leading-none ${scrolled ? 'text-emerald-600' : 'text-emerald-300'}`}>
                  FSD Campus
                </span>
              </div>
            </div>

            <div className="LandingPage-div-7">
              {navLinks.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`text-sm font-medium transition-colors hover:text-amber-400 ${
                    scrolled ? 'text-slate-600' : 'text-white/90'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="LandingPage-div-8">
              <button
                onClick={() => navigate('portal-selector')}
                className="LandingPage-button-9"
              >
                Login to Portal
              </button>
            </div>

            <button
              className="LandingPage-button-11"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen
                ? <X className={scrolled ? 'text-slate-800' : 'text-white'} />
                : <Menu className={scrolled ? 'text-slate-800' : 'text-white'} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="LandingPage-div-12">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="LandingPage-button-13"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => navigate('portal-selector')}
              className="LandingPage-button-14"
            >
              Login to Portal
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" className="LandingPage-section-15">
        <div className="LandingPage-div-16">
          <img
            src="https://images.pexels.com/photos/5530437/pexels-photo-5530437.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Students in computer lab"
            className="LandingPage-img-17"
          />
          <div className="LandingPage-div-18" />
        </div>
        <div className="LandingPage-hero-glow LandingPage-hero-glow--amber" />
        <div className="LandingPage-hero-glow LandingPage-hero-glow--emerald" />

        <div className="LandingPage-div-19">
          <div className="LandingPage-div-20">
            <h1 className="LandingPage-h1-24">
              Empowering the{' '}
              <span className="LandingPage-span-25">Youth of Faisalabad</span>{' '}
              with High-Demand IT Skills
            </h1>

            <p className="LandingPage-p-26">
              100% free, industry-oriented IT education at Bano Qabil FSD Campus.
              Join thousands of students building real careers in technology — no fees, no limits.
            </p>

            <div className="LandingPage-div-27">
              <button
                onClick={() => scrollTo('admissions')}
                className="LandingPage-button-28"
              >
                Apply Now <ArrowRight className="LandingPage-arrowright-29" />
              </button>
              <button
                onClick={() => scrollTo('courses')}
                className="LandingPage-button-30"
              >
                Explore Courses
              </button>
            </div>

            {/* CNIC Tracker */}
            <div className="LandingPage-tracker-wrap">
              <div className="LandingPage-tracker-head">
                <span className="LandingPage-tracker-icon">
                  <Search className="LandingPage-tracker-icon-svg" />
                </span>
                <span className="LandingPage-tracker-label">
                  <strong>Track Application Status</strong>
                  <small>Check your admission progress with your CNIC</small>
                </span>
              </div>

              <div className="LandingPage-tracker-panel">
                <p className="LandingPage-tracker-panel-title">Enter your CNIC to view your status</p>
                <div className="LandingPage-tracker-form">
                  <div className="LandingPage-tracker-input-wrap">
                    <Search className="LandingPage-tracker-input-icon" />
                    <input type="text" placeholder="e.g. 33100-1234567-1" className="LandingPage-tracker-input" />
                  </div>
                  <button className="LandingPage-tracker-submit">Track Status</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => scrollTo('courses')}
          className="LandingPage-hero-scroll"
          aria-label="Scroll to explore"
        >
          <ChevronDown className="LandingPage-hero-scroll-icon" />
        </button>
      </section>

      {/* COURSES */}
      <section id="courses" className="LandingPage-section-41">
        <div className="LandingPage-div-2">
          <div className="LandingPage-div-42">
            <span className="LandingPage-span-43">What We Offer</span>
            <h2 className="LandingPage-h2-44">
              Courses at FSD Campus
            </h2>
            <p className="LandingPage-p-45">
              Industry-aligned programs designed to get you job-ready from day one.
            </p>
          </div>

          {!contentLoading && courses.length === 0 ? (
            <p className="LandingPage-empty-note">
              No courses have been published yet — check back soon.
            </p>
          ) : (
            <div className="LandingPage-div-46">
              {courses.map((course) => (
                <div
                  key={course._id || course.title}
                  className="LandingPage-div-47"
                >
                  <div className="LandingPage-div-48">
                    <course.icon className="LandingPage-courseicon-49" />
                  </div>
                  <div className="LandingPage-div-50">
                    <h3 className="LandingPage-h3-51">{course.title}</h3>
                    <span className="LandingPage-span-52">
                      {course.tag}
                    </span>
                  </div>
                  <div className="LandingPage-duration">
                    <Clock className="LandingPage-duration-icon" />
                    <span>{course.duration}</span>
                  </div>
                  {course.campus && (
                    <div className="LandingPage-duration">
                      <MapPin className="LandingPage-duration-icon" />
                      <span>{course.campus}</span>
                    </div>
                  )}
                  <div className="LandingPage-div-54">
                    <span className="LandingPage-span-55">
                      Free Enrollment
                    </span>
                    <button
                      onClick={() => scrollTo('admissions')}
                      className="LandingPage-button-56"
                    >
                      Apply <ChevronRight className="LandingPage-chevronright-57" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY BANO QABIL */}
      <section id="campus" className="LandingPage-section-58">
        <div className="LandingPage-div-2">
          <div className="LandingPage-div-59">
            <div>
              <span className="LandingPage-span-43">Why Choose Us</span>
              <h2 className="LandingPage-h2-60">
                Real Skills. Real Careers.<br />Zero Cost.
              </h2>
              <div className="LandingPage-div-61">
                {[
                  { title: 'Completely Free Education', desc: 'No tuition fees, no hidden charges. Quality IT education accessible to everyone.' },
                  { title: 'Industry Expert Instructors', desc: 'Learn from professionals with real-world industry experience.' },
                  { title: 'Practical, Hands-On Training', desc: 'Labs, projects, and assignments that mirror real workplace tasks.' },
                  { title: 'Certificate on Completion', desc: 'Earn a recognized Bano Qabil certificate upon successfully finishing the course.' },
                  { title: 'Career Support & Freelancing Guidance', desc: 'Job placement assistance and freelancing mentorship included.' },
                ].map((item) => (
                  <div key={item.title} className="LandingPage-div-62">
                    <div className="LandingPage-div-63">
                      <CheckCircle className="LandingPage-checkcircle-64" />
                    </div>
                    <div>
                      <h4 className="LandingPage-h4-65">{item.title}</h4>
                      <p className="LandingPage-p-66">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="LandingPage-stats">
                <div className="LandingPage-stat">
                  <strong>10,000+</strong>
                  <span>Applications Received</span>
                </div>
                <div className="LandingPage-stat">
                  <strong>100%</strong>
                  <span>Free Education</span>
                </div>
                <div className="LandingPage-stat">
                  <strong>Certified</strong>
                  <span>Industry Faculty</span>
                </div>
              </div>
            </div>

            <div className="LandingPage-div-67">
              <div className="LandingPage-div-68">
                <img
                  src="https://images.pexels.com/photos/16171110/pexels-photo-16171110.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                  alt="Student learning at computer"
                  className="LandingPage-img-69"
                />
              </div>
              <div className="LandingPage-div-70">
                <div className="LandingPage-div-71">
                  <div className="LandingPage-div-72">
                    <Award className="LandingPage-graduationcap-6" />
                  </div>
                  <div>
                    <p className="LandingPage-h4-65">Certificate Issued</p>
                    <p className="LandingPage-p-73">HTML/CSS Foundations — Batch FSD-14</p>
                  </div>
                </div>
              </div>
              <div className="LandingPage-div-74">
                <p className="LandingPage-p-75">91%</p>
                <p className="LandingPage-p-76">Avg. Attendance</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADMISSIONS STEPS */}
      <section id="admissions" className="LandingPage-section-77">
        <div className="LandingPage-hero-glow LandingPage-hero-glow--amber LandingPage-glow--faint" />
        <div className="LandingPage-div-2">
          <div className="LandingPage-div-42">
            <span className="LandingPage-span-78">How to Apply</span>
            <h2 className="LandingPage-h2-79">
              Join Bano Qabil FSD Campus
            </h2>
            <p className="LandingPage-p-80">
              The admission process is simple, transparent, and entirely free.
            </p>
          </div>

          <div className="LandingPage-div-81">
            {[
              { step: '01', title: 'Register Online', desc: 'Fill in your basic details and choose your preferred course.' },
              { step: '02', title: 'Entry Test', desc: 'Appear for a short written assessment at the FSD campus.' },
              { step: '03', title: 'Interview', desc: 'A brief interview with the admissions panel.' },
              { step: '04', title: 'Batch Allocated', desc: 'Get your roll number and start your free IT journey.' },
            ].map((item) => (
              <div key={item.step} className="LandingPage-div-82">
                <div className="LandingPage-div-83">{item.step}</div>
                <h3 className="LandingPage-h3-84">{item.title}</h3>
                <p className="LandingPage-p-85">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Registration Form */}
          <div className="LandingPage-div-86">
            <div className="LandingPage-register-head">
              <div className="LandingPage-register-icon">
                <ClipboardList className="LandingPage-register-icon-svg" />
              </div>
              <div>
                <h3 className="LandingPage-h3-87">Quick Registration</h3>
                <p className="LandingPage-register-sub">Your free IT journey starts here — no fees, no hidden charges.</p>
              </div>
            </div>
            <div className="LandingPage-div-88">
              <div>
                <label className="LandingPage-label-89">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmed Hassan"
                  className="LandingPage-input-90"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                />
                {regErrors.name && <p className="LandingPage-field-error">{regErrors.name}</p>}
              </div>
              <div>
                <label className="LandingPage-label-89">CNIC</label>
                <input
                  type="text"
                  placeholder="33100-1234567-1"
                  className="LandingPage-input-90"
                  value={regForm.cnic}
                  onChange={(e) => setRegForm({ ...regForm, cnic: formatCnic(e.target.value) })}
                />
                {regErrors.cnic && <p className="LandingPage-field-error">{regErrors.cnic}</p>}
              </div>
              <div>
                <label className="LandingPage-label-89">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  className="LandingPage-input-90"
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                />
                {regErrors.phone && <p className="LandingPage-field-error">{regErrors.phone}</p>}
              </div>
              <div>
                <label className="LandingPage-label-89">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="LandingPage-input-90"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
                {regErrors.email && <p className="LandingPage-field-error">{regErrors.email}</p>}
              </div>
              <div className="LandingPage-div-91">
                <label className="LandingPage-label-89">Campus</label>
                <select
                  className="LandingPage-select-92"
                  value={regForm.campus}
                  onChange={(e) => setRegForm({ ...regForm, campus: e.target.value, course: '' })}
                >
                  <option value="">Select a campus...</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}{c.city ? ` — ${c.city}` : ''}</option>
                  ))}
                </select>
                {campuses.length === 0 && !contentLoading && (
                  <p className="LandingPage-field-error">No campuses are available yet — please check back soon.</p>
                )}
                {regErrors.campus && <p className="LandingPage-field-error">{regErrors.campus}</p>}
              </div>
              <div className="LandingPage-div-91">
                <label className="LandingPage-label-89">Preferred Course</label>
                <select
                  className="LandingPage-select-92"
                  value={regForm.course}
                  onChange={(e) => setRegForm({ ...regForm, course: e.target.value })}
                  disabled={!regForm.campus || coursesForSelectedCampus.length === 0}
                >
                  <option value="">{regForm.campus ? 'Select a course...' : 'Select a campus first'}</option>
                  {coursesForSelectedCampus.map((c) => (
                    <option key={c._id || c.title} value={c.title}>{c.title}</option>
                  ))}
                </select>
                {regForm.campus && coursesForSelectedCampus.length === 0 && (
                  <p className="LandingPage-field-error">
                    No courses have been added for this campus yet — please choose another campus.
                  </p>
                )}
                {regErrors.course && <p className="LandingPage-field-error">{regErrors.course}</p>}
              </div>
            </div>
            {regMessage && (
              <p className={`LandingPage-form-message ${regStatus === 'success' ? 'LandingPage-form-message--success' : 'LandingPage-form-message--error'}`}>
                {regMessage}
              </p>
            )}
            <button
              className="LandingPage-button-93"
              onClick={handleRegister}
              disabled={regStatus === 'submitting'}
            >
              {regStatus === 'submitting' ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {(contentLoading || testimonials.length > 0) && (
      <section className="LandingPage-section-41">
        <div className="LandingPage-div-2">
          <div className="LandingPage-div-42">
            <span className="LandingPage-span-43">Success Stories</span>
            <h2 className="LandingPage-h2-44">
              What Our Graduates Say
            </h2>
            <p className="LandingPage-p-45">
              Real students, real outcomes — hear it from our graduates.
            </p>
          </div>
          <div className="LandingPage-div-94">
            {testimonials.map((t, i) => (
              <div key={t._id || `${t.name}-${i}`} className="LandingPage-div-95">
                <Quote className="LandingPage-quote-95" />
                <div className="LandingPage-div-96">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="LandingPage-star-97" />
                  ))}
                </div>
                <p className="LandingPage-p-98">"{t.text}"</p>
                <div className="LandingPage-div-71">
                  <div className={`LandingPage-avatar LandingPage-avatar--${(i % 4) + 1}`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="LandingPage-h4-65">{t.name}</p>
                    <p className="LandingPage-p-100">{t.course}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* FOOTER */}
      <footer className="LandingPage-footer-101">
        <div className="LandingPage-div-2">
          <div className="LandingPage-div-102">
            <div>
              <div className="LandingPage-div-103">
                <img src="/logo.png" alt="Bano Qabil" className="LandingPage-logo-5" />
                <div>
                  <span className="LandingPage-span-104">Bano Qabil</span>
                  <span className="LandingPage-span-105">FSD Campus</span>
                </div>
              </div>
              <p className="LandingPage-p-106">
                Empowering Pakistani youth with free, high-quality IT education since its founding.
              </p>
            </div>

            <div>
              <h4 className="LandingPage-h4-107">Quick Links</h4>
              <ul className="LandingPage-ul-108">
                {[
                  { label: 'Home', action: () => scrollTo('hero') },
                  { label: 'Courses', action: () => scrollTo('courses') },
                  { label: 'Admissions', action: () => scrollTo('admissions') },
                  { label: 'Verify Certificate', action: () => navigate('portal-selector') },
                ].map((l) => (
                  <li key={l.label}>
                    <button onClick={l.action} className="LandingPage-button-109">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="LandingPage-h4-107">Portals</h4>
              <ul className="LandingPage-ul-108">
                {['Student Portal', 'Teacher Portal', 'Admin Portal', 'Certificate Verification'].map((l) => (
                  <li key={l}>
                    <button
                      onClick={() => navigate('portal-selector')}
                      className="LandingPage-button-109"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="LandingPage-h4-107">FSD Campus</h4>
              <div className="LandingPage-div-110">
                <div className="LandingPage-div-33">
                  <MapPin className="LandingPage-mappin-111" />
                  <p className="LandingPage-p-112">Main Boulevard, Faisalabad, Punjab, Pakistan</p>
                </div>
                <div className="LandingPage-div-33">
                  <Phone className="LandingPage-phone-113" />
                  <p className="LandingPage-p-112">0300-BANO-FSD</p>
                </div>
                <div className="LandingPage-div-33">
                  <Mail className="LandingPage-phone-113" />
                  <p className="LandingPage-p-112">fsd@banoquabil.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="LandingPage-div-114">
            <p className="LandingPage-p-115">
              &copy; 2026 Bano Qabil FSD Campus. All rights reserved.
            </p>
            <div className="LandingPage-div-116">
              <Users className="LandingPage-users-117" />
              <span className="LandingPage-span-118">Part of the Bano Qabil National Initiative</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
