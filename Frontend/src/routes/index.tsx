import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, ArrowRight, Sparkles, BarChart3, PenTool, MessageSquare, Globe, 
  Search, Cpu, TrendingUp, Users, 
  X, CheckCircle, Zap, LayoutDashboard, Camera, Smartphone, Mail, FileText,
  Activity, Target, Lock, Headphones, RefreshCw, Database
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { createFileRoute, Link } from '@tanstack/react-router';
import { dbLanding as db } from '../lib/firebase';
import '../landing.css';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Saadhyam AI — AI-Powered Business Growth Platform' },
      { name: 'description', content: 'Sync with your platforms automatically and drive automated growth with Saadhyam AI.' }
    ]
  }),
  component: PreLandingPage
});

type TranslationKey = 'navPlatform' | 'navSolutions' | 'navPricing' | 'startButton' | 'heroTag' | 'heroTitlePart1' | 'heroTitleGradient' | 'heroSub' | 'freeTrial' | 'watchDemo';

const translations: Record<'en' | 'hi' | 'te', Record<TranslationKey, string>> = {
  en: {
    navPlatform: "Platform", navSolutions: "Solutions", navPricing: "Pricing", startButton: "Let's Start",
    heroTag: "AI-Powered Business Growth Platform",
    heroTitlePart1: "AI That Powers Your Business Growth ",
    heroTitleGradient: "Automatically",
    heroSub: "Saadhyam AI helps businesses analyze, automate, optimize, and scale using AI-powered insights, intelligent workflows, and growth automation systems.",
    freeTrial: "Start Free Trial", watchDemo: "Watch AI Demo"
  },
  hi: {
    navPlatform: "మంచ్", navSolutions: "సమాధాన్", navPricing: "మూల్య నిరాధారన్", startButton: "శూరు కరేం",
    heroTag: "एआई-पावर्ड बिजनेस ग्रोथ प्लेटफॉर्म",
    heroTitlePart1: "एआई जो आपके व्यापार के विकास को संचालित करता है ",
    heroTitleGradient: "स्वचालित रूप से",
    heroSub: "साध्यम एआई व्यवसायों को एआई-संचालित अंतर्दृष्टि, बुद्धिमान वर्कफ़्लो और विकास स्वचालन प्रणालियों का उपयोग करके विश्लेषण, स्वचालन, अनुकूलन और स्केल करने में मदद करता है।",
    freeTrial: "निःशुल्क परीक्षण शुरू करें", watchDemo: "एआई डेमो देखें"
  },
  te: {
    navPlatform: "ప్లాట్‌ఫారమ్", navSolutions: "పరిష్కారాలు", navPricing: "ధరలు", startButton: "ప్రారంభించండి",
    heroTag: "AI-ఆధారిత వ్యాపార వృద్ధి వేదిక",
    heroTitlePart1: "మీ వ్యాపార వృద్ధిని నడిపించే AI ",
    heroTitleGradient: "స్వయంచాలకంగా",
    heroSub: "AI-ఆధారిత అంతర్దృష్టులు, ఇంటెలిజెంట్ వర్క్‌ఫ్లోలు మరియు వృద్ధి ఆటోమేషన్ సిస్టమ్‌లను ఉపయోగించి వ్యాపారాలను విశ్లేషించడానికి, ఆటోమేట్ చేయడానికి, ఆప్టిమైజ్ చేయడానికి మరియు స్కేల్ చేయడానికి Saadhyam AI సహాయపడుతుంది.",
    freeTrial: "ఉచిత ట్రయల్ ప్రారంభించండి", watchDemo: "AI డెమో చూడండి"
  }
};

const chartData = [
  { day: 'Mon', value: 12 }, { day: 'Tue', value: 18 }, { day: 'Wed', value: 35 },
  { day: 'Thu', value: 42 }, { day: 'Fri', value: 68 }, { day: 'Sat', value: 85 },
  { day: 'Sun', value: 100 }
];

const Particles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);
  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 4 + 1, duration: Math.random() * 20 + 10, delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div key={p.id} className="particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
};

interface LogoProps {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  withGlow?: boolean;
}

const Logo = ({ width = '32px', height = '32px', style = {}, withGlow = true }: LogoProps) => (
  <div className={`logo-container ${withGlow ? 'glow-bg' : ''}`} style={{ width, height, ...style }}>
    <motion.img 
      src="https://i.ibb.co/rRhY66tN/Whats-App-Image-2026-05-11-at-8-22-35-PM-removebg-preview.png" 
      alt="Saadhyam Logo" className="logo-img"
      initial={{ rotateY: 0 }} animate={{ rotateY: 360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

const TypingText = ({ texts }: { texts: string[] }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setBlink((prev) => !prev), 500);
    return () => clearTimeout(timeout);
  }, [blink]);

  useEffect(() => {
    if (subIndex === texts[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2000);
      return () => clearTimeout(timeout);
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % texts.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 30 : 80, Math.random() * 100));
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, texts]);

  return (
    <span className="text-gradient">
      {texts[index].substring(0, subIndex)}
      <span style={{ opacity: blink ? 1 : 0, color: 'var(--accent-purple)', marginLeft: '2px', transition: 'opacity 0.1s' }}>|</span>
    </span>
  );
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setCount(value); clearInterval(timer); } 
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{count}</span>;
};

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LeadCaptureModal = ({ isOpen, onClose, onSuccess }: LeadCaptureModalProps) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', businessType: '', goals: '' });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.businessType || !formData.goals) {
      alert("Please fill in all fields.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!db) {
        throw new Error("Firestore instance not available. Make sure Firebase is properly configured.");
      }
      await addDoc(collection(db, "leads"), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        businessType: formData.businessType,
        goals: formData.goals,
        timestamp: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => { 
        setSubmitted(false); 
        onSuccess();
        onClose(); 
      }, 3000);
    } catch (error: any) {
      console.error("Error adding document: ", error);
      alert(`Failed to save waitlist data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="modal-content" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--text-secondary)" />
            </button>
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontSize: '24px', marginBottom: '10px', color: 'white' }}>You're on the list! 🎉</h3>
                <p style={{ color: 'var(--text-secondary)' }}>We've received your interest. You'll be one of our very first founding customers!</p>
              </motion.div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '28px', marginBottom: '8px', color: 'white' }}>Join the Early Beta</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Register your interest today to secure early access and become one of our first customers.</p>
                </div>
                <form onSubmit={handleSubmit}>
                  <input required className="input-field" placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input required type="email" className="input-field" placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <input required type="tel" className="input-field" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  <input required type="text" className="input-field" placeholder="Business/Organization Name" value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} />
                  <textarea className="input-field" placeholder="What are your main goals?" value={formData.goals} onChange={e => setFormData({...formData, goals: e.target.value})} style={{ minHeight: '80px', resize: 'vertical' }} />
                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '16px', opacity: isSubmitting ? 0.7 : 1 }}>
                    {isSubmitting ? 'Registering...' : 'Register Interest'} <Zap size={18} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const FloatingContact = () => {
  return (
    <motion.a 
      href="mailto:info@saadhyam.com"
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.6, type: 'spring' }}
      whileHover={{ y: -5, scale: 1.05 }}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(20, 20, 20, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '100px',
        padding: '10px 18px',
        textDecoration: 'none',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.15)',
        transition: 'border-color 0.3s, box-shadow 0.3s'
      }}
      className="floating-contact-btn"
    >
      <div style={{
        background: 'linear-gradient(135deg, #9333ea, #ec4899)',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 10px rgba(168, 85, 247, 0.4)',
        flexShrink: 0
      }}>
        <Mail size={16} color="white" />
      </div>
      <div className="floating-contact-text" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
        <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Us</span>
        <span style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>info@saadhyam.com</span>
      </div>
    </motion.a>
  );
};

interface NavbarProps {
  onOpenModal: () => void;
  lang: 'en' | 'hi' | 'te';
  setLang: (l: 'en' | 'hi' | 'te') => void;
}

const Navbar = ({ onOpenModal, lang, setLang }: NavbarProps) => {
  const t = translations[lang];
  return (
    <motion.nav initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Logo width="32px" height="32px" />
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Saadhyam <span className="text-gradient">AI</span></span>
      </div>
      <div className="nav-links" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <Link to="/main" hash="features" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '15px', transition: 'color 0.3s' }}>{t.navPlatform}</Link>
        <Link to="/main" hash="how" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '15px', transition: 'color 0.3s' }}>{t.navSolutions}</Link>
        <Link to="/main" hash="pricing" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '15px', transition: 'color 0.3s' }}>{t.navPricing}</Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="mailto:info@saadhyam.com" className="nav-email" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: 500, marginRight: '8px', transition: 'color 0.3s' }}>
          <Mail size={14} color="var(--accent-purple)" />
          <span>info@saadhyam.com</span>
        </a>
        <select className="language-selector" value={lang} onChange={(e) => setLang(e.target.value as any)}>
          <option value="en">English</option><option value="hi">हिंदी</option><option value="te">తెలుగు</option>
        </select>
        <button className="btn-primary" onClick={onOpenModal} style={{ padding: '10px 24px', fontSize: '14px' }}>
          {t.startButton} <ArrowRight size={16} />
        </button>
      </div>
    </motion.nav>
  );
};

interface HeroProps {
  onOpenModal: () => void;
  lang: 'en' | 'hi' | 'te';
}

const Hero = ({ onOpenModal, lang }: HeroProps) => {
  const t = translations[lang];
  return (
    <section className="section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '120px' }}>
      <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.1)', padding: '8px 16px', borderRadius: '100px', marginBottom: '30px', border: '1px solid rgba(168, 85, 247, 0.2)' }}
        >
          <Sparkles size={16} color="var(--accent-purple)" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-purple)' }}>{t.heroTag}</span>
        </motion.div>
        <motion.h1 className="hero-heading" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          style={{ fontSize: '72px', lineHeight: '1.1', marginBottom: '24px', maxWidth: '1000px', margin: '0 auto 24px' }}
        >
          {t.heroTitlePart1} <span className="text-gradient">{t.heroTitleGradient}</span>
        </motion.h1>
        <motion.div className="hero-typing-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
          style={{ fontSize: '32px', fontWeight: 600, marginBottom: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Saadhyam AI for</span>
          <div className="hero-typing-container" style={{ position: 'relative', height: '40px', width: '100%', maxWidth: '380px', textAlign: 'left', display: 'flex', alignItems: 'center' }}>
             <TypingText texts={['Restaurants', 'Salons', 'Startups', 'Agencies', 'E-commerce Brands', 'Coaches', 'Healthcare Clinics', 'Real Estate Companies']} />
          </div>
        </motion.div>
        <motion.p initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 40px', lineHeight: '1.6' }}
        >
          {t.heroSub}
        </motion.p>
        <motion.div className="hero-buttons" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}
        >
          <button className="btn-primary" onClick={onOpenModal} style={{ padding: '16px 32px', fontSize: '18px' }}>
            {t.freeTrial} <ArrowRight size={20} />
          </button>
          <Link to="/main" className="btn-secondary" style={{ padding: '16px 32px', fontSize: '18px', textDecoration: 'none' }}>
            <Play size={20} color="var(--accent-purple)" style={{ marginRight: '8px', verticalAlign: 'middle' }} /> {t.watchDemo}
          </Link>
        </motion.div>
      </div>
      <Particles />
    </section>
  );
};

const AnimatedDashboardFlow = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const runSequence = async () => {
      while (isMounted) {
        setStep(0); 
        await new Promise(r => setTimeout(r, 2500));
        if (!isMounted) break;
        setStep(1); 
        await new Promise(r => setTimeout(r, 2500));
        if (!isMounted) break;
        setStep(2); 
        await new Promise(r => setTimeout(r, 6000));
      }
    };
    runSequence();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="section" style={{ background: 'transparent', paddingBottom: '60px', paddingTop: '0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
           <h2 style={{ fontSize: '40px', color: 'white' }}>How Saadhyam AI <span className="text-gradient">Transforms Your Data</span></h2>
        </div>
        
        <div style={{ position: 'relative', minHeight: '600px', display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: '1000px' }}>
          <AnimatePresence mode="wait">
            
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }} transition={{ duration: 0.5 }}
                className="bento-card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center', background: 'rgba(20,20,20,0.9)' }}
              >
                <div style={{ background: 'rgba(59,130,246,0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(59,130,246,0.2)' }}>
                   <Activity size={32} color="var(--accent-blue)" />
                </div>
                <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>Connecting Data Sources</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Syncing with your business platforms automatically...</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {['Google Analytics', 'Meta Ads', 'Sales CRM'].map((src, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                      >
                         <span style={{ color: 'white', fontSize: '14px' }}>{src}</span>
                         <CheckCircle size={16} color="#10b981" />
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }} transition={{ duration: 0.5 }}
                className="bento-card" style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center', background: 'rgba(20,20,20,0.9)', overflow: 'hidden', position: 'relative' }}
              >
                <motion.div animate={{ top: ['-20%', '120%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: 'var(--accent-purple)', boxShadow: '0 0 20px 10px rgba(168, 85, 247, 0.4)', zIndex: 0 }}
                />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ background: 'rgba(168,85,247,0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(168,85,247,0.2)' }}>
                     <Cpu size={32} color="var(--accent-purple)" />
                  </div>
                  <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '10px' }}>AI Engine Processing</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Analyzing patterns and spotting growth opportunities...</p>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {Array.from({length: 12}).map((_, i) => (
                       <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                         style={{ width: '30px', height: '8px', background: 'rgba(168,85,247,0.5)', borderRadius: '4px' }}
                       />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, scale: 0.8, rotateX: 10 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.8, type: 'spring' }}
                className="glass-panel" style={{ width: '100%', padding: '30px', borderRadius: '30px', transformStyle: 'preserve-3d' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                       <LayoutDashboard size={20} color="var(--accent-purple)" />
                     </div>
                     <div>
                       <h4 style={{ fontSize: '18px', margin: 0, color: 'white' }}>Live Dashboard Generated! 🚀</h4>
                       <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>AI has mapped out your complete growth trajectory.</p>
                     </div>
                  </div>
                </div>

                <div className="dashboard-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                   {[
                     { label: 'Business Health', val: 78, sub: 'Good', icon: Activity, color: '#a855f7' },
                     { label: 'AI Visibility', val: 42, sub: 'Needs Improvement', icon: Search, color: '#f59e0b' },
                     { label: 'Lead Conversion', val: 61, sub: 'Average', icon: Users, color: '#ec4899' },
                     { label: 'Content Activity', val: 35, sub: 'Low', icon: FileText, color: '#3b82f6' }
                   ].map((m, i) => (
                     <div key={i} className="bento-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                           <m.icon size={18} color={m.color} />
                           <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                           <span style={{ fontSize: '32px', fontWeight: 800, color: 'white' }}><AnimatedNumber value={m.val} /></span>
                           <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>/100</span>
                        </div>
                        <span style={{ fontSize: '12px', color: m.color, fontWeight: 500 }}>{m.sub}</span>
                     </div>
                   ))}
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="bento-card" style={{ height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                         <div>
                           <h4 style={{ fontSize: '16px', margin: 0, color: 'white' }}>Growth Trajectory</h4>
                           <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>AI Visibility Score (Last 7 Days)</p>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.1)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                           <TrendingUp size={14} color="var(--accent-purple)" />
                           <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)' }}>+142%</span>
                         </div>
                      </div>
                      <div style={{ height: '240px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                            <Tooltip cursor={{ stroke: 'rgba(168, 85, 247, 0.1)', strokeWidth: 2 }} contentStyle={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} />
                            <Line type="monotone" dataKey="value" stroke="var(--accent-purple)" strokeWidth={3} dot={{ r: 4, fill: '#111', strokeWidth: 2, stroke: 'var(--accent-purple)' }} activeDot={{ r: 6, fill: 'var(--accent-pink)', stroke: '#111', strokeWidth: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 350px' }}>
                    <h4 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-secondary)' }}>Recommended Actions for You</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                       {[
                         { title: 'Ask 5 customers for Google reviews', impact: 'High Impact', icon: Globe },
                         { title: 'Post 1 offer on Instagram', impact: 'High Impact', icon: Camera },
                         { title: 'Send WhatsApp message to 10 leads', impact: 'Medium Impact', icon: Smartphone }
                       ].map((act, i) => (
                         <div key={i} className="bento-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' }}><act.icon size={20} color="white" /></div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', lineHeight: '1.3', color: 'white' }}>{act.title}</p>
                              <span style={{ fontSize: '11px', background: 'rgba(236,72,153,0.1)', color: '#ec4899', padding: '4px 8px', borderRadius: '100px', fontWeight: 600, border: '1px solid rgba(236,72,153,0.2)' }}>{act.impact}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const AIAnalysis = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const runSequence = async () => {
      while (isMounted) {
        setStep(0); 
        await new Promise(r => setTimeout(r, 3000));
        if (!isMounted) break;
        setStep(1); 
        await new Promise(r => setTimeout(r, 3000));
        if (!isMounted) break;
        setStep(2); 
        await new Promise(r => setTimeout(r, 4500));
      }
    };
    runSequence();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="section" style={{ background: 'transparent' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>AI analyzes your business <span className="text-gradient">automatically</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '800px', margin: '0 auto' }}>
            Saadhyam AI scans your business data, customer engagement, competitors, and growth performance to generate actionable recommendations.
          </p>
        </div>

        <div style={{ position: 'relative', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: '1000px' }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="scan" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.5 }}
                className="bento-card" style={{ width: '100%', maxWidth: '800px', padding: '40px', background: 'rgba(20,20,20,0.9)', display: 'flex', gap: '40px', alignItems: 'center' }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '28px', color: 'white', marginBottom: '10px', display: 'flex', alignItems: 'center' }}><Search color="var(--accent-blue)" style={{ marginRight: '10px' }} /> Scanning Market Data...</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Real-time analysis of audience engagement and market trends.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                     {['Audience Sentiment', 'Local Search Volume', 'Engagement Rates'].map((item, i) => (
                       <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: '8px' }}>
                         <span style={{ color: 'white', fontWeight: 500 }}>{item}</span>
                         <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', width: '150px', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div animate={{ width: ['0%', '100%'] }} transition={{ duration: 2.5, ease: "easeInOut" }} style={{ height: '100%', background: 'var(--accent-blue)', borderRadius: '3px' }} />
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="compete" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.5 }}
                className="bento-card" style={{ width: '100%', maxWidth: '800px', padding: '40px', background: 'rgba(20,20,20,0.9)', display: 'flex', gap: '40px', alignItems: 'center' }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '28px', color: 'white', marginBottom: '10px', display: 'flex', alignItems: 'center' }}><Target color="var(--accent-pink)" style={{ marginRight: '10px' }} /> Competitor Intelligence</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Benchmarking your performance against top competitors in real-time.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '180px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                     <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} style={{ width: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px 6px 0 0', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Comp A</span></motion.div>
                     <motion.div initial={{ height: 0 }} animate={{ height: '100%' }} style={{ width: '60px', background: 'var(--accent-pink)', borderRadius: '6px 6px 0 0', position: 'relative', boxShadow: '0 0 20px rgba(236,72,153,0.5)' }}><span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>You</span></motion.div>
                     <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} style={{ width: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px 6px 0 0', position: 'relative' }}><span style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600 }}>Comp B</span></motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="insight" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.5, type: 'spring' }}
                className="bento-card" style={{ width: '100%', maxWidth: '800px', padding: '40px', background: 'rgba(20,20,20,0.9)', border: '1px solid var(--accent-purple)' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ background: 'rgba(168,85,247,0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(168,85,247,0.3)' }}>
                     <Sparkles size={32} color="var(--accent-purple)" />
                  </div>
                  <h3 style={{ fontSize: '32px', color: 'white', marginBottom: '10px' }}>Actionable Insights Found</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>AI has identified 3 critical growth levers for this week.</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                   {[
                     { title: 'Launch Ad Campaign', desc: 'High demand detected in your area.', impact: 'High Return', color: '#10b981' },
                     { title: 'Content Update', desc: 'Competitor B dropped in rankings.', impact: 'Medium Effort', color: '#3b82f6' },
                     { title: 'Customer Retention', desc: 'Send 10% discount to past clients.', impact: 'Quick Win', color: '#f59e0b' }
                   ].map((item, i) => (
                     <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', borderTop: `2px solid ${item.color}` }}>
                        <h4 style={{ color: 'white', marginBottom: '8px', fontSize: '15px' }}>{item.title}</h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px', lineHeight: '1.4' }}>{item.desc}</p>
                        <span style={{ fontSize: '11px', color: item.color, background: `${item.color}20`, padding: '4px 8px', borderRadius: '100px', fontWeight: 600 }}>{item.impact}</span>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const Workflow = () => {
  return (
    <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>From insight to execution <span className="text-gradient">automatically</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '800px', margin: '0 auto' }}>
             See exactly how Saadhyam AI connects your tools, processes your data, and drives automated growth.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '30px', position: 'relative' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              
              <div style={{ padding: '50px', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', background: 'rgba(59, 130, 246, 0.02)' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
                    <Database size={20} color="white" />
                 </div>
                 <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '15px' }}>1. Connect</h3>
                 <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px' }}>Secure, real-time connection to your business platforms.</p>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', fontSize: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <Smartphone size={16} color="var(--text-secondary)" /> Instagram API
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', fontSize: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <Globe size={16} color="var(--text-secondary)" /> Website Analytics
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'white', fontSize: '14px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <LayoutDashboard size={16} color="var(--text-secondary)" /> Sales CRM
                    </div>
                 </div>
              </div>

              <div style={{ padding: '50px', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', background: 'rgba(168, 85, 247, 0.03)' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
                    <Cpu size={20} color="white" />
                 </div>
                 <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '15px' }}>2. Process</h3>
                 <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px' }}>The AI Engine detects patterns and formulates strategies.</p>

                 <div style={{ height: '180px', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '12px', background: 'rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
                    <motion.div animate={{ top: ['-20%', '120%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', left: 0, right: 0, height: '3px', background: 'var(--accent-purple)', boxShadow: '0 0 15px 5px rgba(168,85,247,0.5)' }} />
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', opacity: 0.5 }}>
                       <div style={{ width: '80%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                       <div style={{ width: '60%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                       <div style={{ width: '90%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                       <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                       <div style={{ width: '70%', height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                    </div>
                 </div>
              </div>

              <div style={{ padding: '50px', position: 'relative', background: 'rgba(236, 72, 153, 0.02)' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
                    <Zap size={20} color="white" />
                 </div>
                 <h3 style={{ fontSize: '24px', color: 'white', marginBottom: '15px' }}>3. Execute</h3>
                 <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px' }}>Automated actions deployed directly to your platforms.</p>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '16px', background: 'rgba(236,72,153,0.05)', borderRadius: '12px', borderLeft: '3px solid var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <Camera size={18} color="white" />
                       <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Publish IG Reel</span>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(236,72,153,0.05)', borderRadius: '12px', borderLeft: '3px solid var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <MessageSquare size={18} color="white" />
                       <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Reply to Review</span>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(236,72,153,0.05)', borderRadius: '12px', borderLeft: '3px solid var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                       <Mail size={18} color="white" />
                       <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>Send Promo Email</span>
                    </div>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </section>
  );
};

interface AnimatedGeneratorProps {
  title: string;
  subtitle: string;
  inputAction: string;
  generatedOutput: string;
  icon: React.ComponentType<any>;
  color: string;
}

const AnimatedGenerator = ({ title, subtitle, inputAction, generatedOutput, icon: Icon, color }: AnimatedGeneratorProps) => {
  const [step, setStep] = useState(0); 
  
  useEffect(() => {
    let isMounted = true;
    const runSequence = async () => {
      if (!isMounted) return;
      setStep(0);
      await new Promise(r => setTimeout(r, 1000));
      if (!isMounted) return;
      setStep(1); 
      await new Promise(r => setTimeout(r, 2000));
      if (!isMounted) return;
      setStep(2); 
      await new Promise(r => setTimeout(r, 1500));
      if (!isMounted) return;
      setStep(3); 
      await new Promise(r => setTimeout(r, 4000));
      if (isMounted) runSequence();
    };
    runSequence();
    return () => { isMounted = false; };
  }, []);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', marginBottom: '120px' }}>
      <div style={{ flex: '1 1 400px' }}>
        <h2 style={{ fontSize: '40px', marginBottom: '16px', color: 'white' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginBottom: '30px' }}>{subtitle}</p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', color: 'var(--text-secondary)', fontSize: '14px' }}>Fast</span>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', color: 'var(--text-secondary)', fontSize: '14px' }}>Automated</span>
          <span style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', color: 'var(--text-secondary)', fontSize: '14px' }}>Scalable</span>
        </div>
      </div>

      <div className="bento-card" style={{ flex: '1 1 400px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
           <p style={{ margin: 0, color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
             <Icon size={16} color={color} /> 
             {step === 0 ? <span style={{ opacity: 0.5 }}>Waiting for input...</span> : inputAction}
           </p>
        </div>

        <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {step === 1 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          )}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <RefreshCw size={18} className="logo-img" style={{ animation: 'logoFloat 1s infinite' }} /> Generating AI Output...
            </motion.div>
          )}
          {step === 3 && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} 
              style={{ background: `rgba(${color === 'var(--accent-pink)' ? '236,72,153' : '59,130,246'}, 0.1)`, border: `1px solid ${color}`, padding: '20px', borderRadius: '16px', width: '100%' }}
            >
               <h4 style={{ color: 'white', margin: '0 0 8px 0' }}>Success</h4>
               <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14px' }}>{generatedOutput}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const ContentStudioAndAutomation = () => {
  return (
    <section className="section" style={{ background: 'transparent' }}>
      <div className="container">
        
        <AnimatedGenerator 
          title="AI creates content that drives results"
          subtitle="Generate highly converting social posts, ad copies, and emails in seconds."
          inputAction="Create an Instagram post for weekend sale..."
          generatedOutput="🎉 Weekend Flash Sale! Get 20% OFF all services. Limited slots available, book now! #Sale"
          icon={PenTool}
          color="var(--accent-pink)"
        />

        <AnimatedGenerator 
          title="Smart automation for modern businesses"
          subtitle="Let AI handle customer replies, scheduling, and workflow triggers automatically."
          inputAction="New Google Review received: 5 Stars!"
          generatedOutput="AI Auto-Reply Sent: 'Thank you so much for the 5 stars! We look forward to seeing you again soon!'"
          icon={Cpu}
          color="var(--accent-blue)"
        />

      </div>
    </section>
  );
};

const AEOSection = () => {
  return (
    <section className="section" style={{ background: 'transparent' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '48px', marginBottom: '20px' }}>Optimized for <span className="text-gradient">AI-powered search</span> systems</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '800px', margin: '0 auto' }}>
            Saadhyam AI structures business content for Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) to improve visibility.
          </p>
        </div>
        <div className="aeo-geo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div className="bento-card" style={{ padding: '40px' }}>
             <h3 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
               <Search color="var(--accent-purple)" /> AEO Features
             </h3>
             <ul style={{ listStyle: 'none', padding: 0 }}>
               {['FAQ-based structured content', 'Voice-search optimization', 'AI answer formatting', 'Search visibility enhancement'].map((f, i) => (
                 <li key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                   <CheckCircle size={16} color="var(--accent-purple)" /> {f}
                 </li>
               ))}
             </ul>
          </div>
          <div className="bento-card" style={{ padding: '40px' }}>
             <h3 style={{ fontSize: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
               <Globe color="var(--accent-pink)" /> GEO Features
             </h3>
             <ul style={{ listStyle: 'none', padding: 0 }}>
               {['Context-rich content generation', 'Brand trust signals', 'AI recommendation optimization', 'Intelligent content structuring'].map((f, i) => (
                 <li key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                   <CheckCircle size={16} color="var(--accent-pink)" /> {f}
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const AIAssistant = () => {
  const capabilities = ['Generate growth strategies', 'Analyze competitors', 'Create campaigns', 'Generate marketing content', 'Suggest business improvements', 'Optimize customer engagement'];
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.05), transparent)' }}>
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '60px' }}>
        <div style={{ flex: '1 1 400px' }}>
          <h2 style={{ fontSize: '48px', marginBottom: '24px' }}>Meet your AI Growth <span className="text-gradient">Assistant</span></h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0' }}>
             {capabilities.map((item, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.1)', borderRadius: '50%', padding: '4px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                    <Zap size={16} color="var(--accent-purple)" />
                  </div>
                  {item}
                </li>
             ))}
          </ul>
        </div>
        <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="bento-card" style={{ flex: '1 1 400px', height: '400px', padding: '30px', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <Logo width="24px" height="24px" withGlow={false} />
            <span style={{ fontWeight: 600, color: 'white' }}>Saadhyam Assistant</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ alignSelf: 'flex-end', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px 16px 0 16px', maxWidth: '80%', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'white' }}>How can we improve Q3 conversion rates for our local business?</p>
            </div>
            <div style={{ alignSelf: 'flex-start', background: 'rgba(168, 85, 247, 0.1)', padding: '16px', borderRadius: '16px 16px 16px 0', maxWidth: '80%', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                 <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
              </div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.5, duration: 0.5 }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'white' }}>
                  Based on your current traffic and competitor analysis, I recommend deploying a hyper-personalized WhatsApp sequence and a new Weekend Offer. <br/><br/>
                  I have automatically drafted the content. Shall I schedule the campaign?
                </p>
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                   <button style={{ background: 'linear-gradient(135deg, #9333ea, #ec4899)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Schedule Campaign</button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TrustAndBenefits = () => {
  const businesses = ['Restaurants', 'Salons', 'Startups', 'Agencies', 'E-commerce Brands', 'Coaches', 'Healthcare Clinics', 'Real Estate Companies', 'Local Businesses'];
  return (
    <section className="section" style={{ textAlign: 'center' }}>
      <div className="container">
        <h3 style={{ fontSize: '32px', marginBottom: '24px', color: 'white' }}>Built for scale. Designed for trust.</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', marginBottom: '80px' }}>
           {[
             { title: 'Secure Authentication', icon: Lock }, { title: 'AI-Powered Insights', icon: BarChart3 },
             { title: 'Real-Time Analytics', icon: Activity }, { title: 'Scalable Infrastructure', icon: Cpu },
             { title: '24/7 Support', icon: Headphones }
           ].map((t, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                <t.icon size={18} color="var(--accent-purple)" /> {t.title}
             </div>
           ))}
        </div>
        <h3 style={{ fontSize: '24px', marginBottom: '24px', color: 'var(--text-secondary)' }}>Empowering Businesses Everywhere</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          {businesses.map((b, i) => (
            <span key={i} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{b}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

interface CTAProps {
  onOpenModal: () => void;
}

const CTA = ({ onOpenModal }: CTAProps) => {
  return (
    <section className="section" style={{ position: 'relative', overflow: 'hidden', padding: '120px 0' }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 60%)', zIndex: 0 }} />
      <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <Logo width="80px" height="80px" style={{ marginBottom: '30px' }} />
          <h2 style={{ fontSize: '56px', marginBottom: '20px', maxWidth: '800px', margin: '0 auto 20px', lineHeight: '1.1' }}>
            Start building your AI-powered <br/><span className="text-gradient">business growth system today.</span>
          </h2>
          <button className="btn-primary" onClick={onOpenModal} style={{ padding: '20px 48px', fontSize: '20px', boxShadow: '0 20px 40px -10px rgba(168, 85, 247, 0.5)' }}>
            Launch Your AI Business System <ArrowRight size={24} />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '60px 0', background: 'rgba(0,0,0,0.4)' }}>
    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Logo width="28px" height="28px" withGlow={false} />
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>Saadhyam AI</span>
      </div>
      <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Powered by MentNeo</p>
      </div>
      <div style={{ display: 'flex', gap: '24px' }}>
        <a href="#" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px' }}>Privacy</a>
        <a href="#" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px' }}>Terms</a>
        <a href="mailto:info@saadhyam.com" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', transition: 'color 0.3s' }}>Contact</a>
      </div>
    </div>
  </footer>
);

function PreLandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi' | 'te'>('en');

  return (
    <div className="landing-wrapper">
      <Navbar onOpenModal={() => setIsModalOpen(true)} lang={lang} setLang={setLang} />
      <LeadCaptureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {}} />
      <Hero onOpenModal={() => setIsModalOpen(true)} lang={lang} />
      <AnimatedDashboardFlow />
      <AIAnalysis />
      <Workflow />
      <ContentStudioAndAutomation />
      <AEOSection />
      <AIAssistant />
      <TrustAndBenefits />
      <CTA onOpenModal={() => setIsModalOpen(true)} />
      <Footer />
      <FloatingContact />
    </div>
  );
}
