import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { dbLanding as db, authLanding as auth } from '../lib/firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Search, Download, LogOut, ShieldAlert, Users, Calendar, 
  Briefcase, Phone, Mail, Cpu, TrendingUp, Check, Eye
} from 'lucide-react';
import { createFileRoute } from '@tanstack/react-router';
import '../landing.css';

export const Route = createFileRoute('/landing-admin')({
  head: () => ({
    meta: [
      { title: 'Saadhyam AI — Waitlist Admin Dashboard' }
    ]
  }),
  component: LandingAdmin
});

const COLORS = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1'];

interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  goals?: string;
  timestamp?: any;
  formattedDate: string;
  rawDate: Date | null;
}

function LandingAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true); 
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [businessFilter, setBusinessFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null); 

  const fetchLeads = async () => {
    if (!db) return;
    setLeadsLoading(true);
    try {
      const q = query(collection(db, "leads"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedLeads: Lead[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = 'N/A';
        let rawDate: Date | null = null;
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === 'function') {
            rawDate = data.timestamp.toDate();
            formattedDate = rawDate!.toLocaleString();
          } else if (data.timestamp instanceof Date) {
            rawDate = data.timestamp;
            formattedDate = rawDate.toLocaleString();
          } else {
            const parsed = new Date(data.timestamp);
            if (!isNaN(parsed.getTime())) {
              rawDate = parsed;
              formattedDate = parsed.toLocaleString();
            }
          }
        }
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          businessType: data.businessType,
          goals: data.goals,
          timestamp: data.timestamp,
          formattedDate,
          rawDate
        };
      });
      setLeads(fetchedLeads);
    } catch (error) {
      console.error("Error fetching leads: ", error);
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists() && (
            userDocSnap.data().isAdmin === true || 
            userDocSnap.data().role === 'admin' || 
            userDocSnap.data().tag === 'admin'
          )) {
            setIsAuthenticated(true);
            setLoginError('');
            fetchLeads();
          } else {
            setLoginError('Access Denied: You do not have admin permissions.');
            setIsAuthenticated(false);
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error verifying admin status:", error);
          setLoginError('Error verifying admin permissions.');
          setIsAuthenticated(false);
          await signOut(auth);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) {
      setLoginError('Authentication setup is incomplete.');
      return;
    }
    setLoginError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists() && (
        userDocSnap.data().isAdmin === true || 
        userDocSnap.data().role === 'admin' || 
        userDocSnap.data().tag === 'admin'
      )) {
        setIsAuthenticated(true);
        fetchLeads();
      } else {
        setLoginError('Access Denied: You do not have admin permissions.');
        setIsAuthenticated(false);
        await signOut(auth);
      }
    } catch (error: any) {
      console.error("Authentication error: ", error);
      let errorMsg = 'Failed to authenticate. Please check your credentials.';
      if (error.code === 'auth/invalid-email') errorMsg = 'Invalid email address format.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'Incorrect email or password.';
      }
      setLoginError(errorMsg);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Business/Organization', 'Goals', 'Submission Time'];
    const rows = leads.map(lead => [
      lead.id,
      lead.name || '',
      lead.email || '',
      lead.phone || '',
      lead.businessType || '',
      `"${(lead.goals || '').replace(/"/g, '""')}"`,
      lead.formattedDate
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `saadhyam_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      (lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.businessType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.goals || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilter = businessFilter === 'All' || 
      (lead.businessType || '').toLowerCase().trim() === businessFilter.toLowerCase().trim();
    
    return matchesSearch && matchesFilter;
  });

  const getUniqueBusinessTypes = () => {
    const typesMap: Record<string, string> = {};
    leads.forEach(lead => {
      if (lead.businessType) {
        const cleaned = lead.businessType.trim();
        const lower = cleaned.toLowerCase();
        if (!typesMap[lower]) {
          typesMap[lower] = cleaned;
        }
      }
    });
    return ['All', ...Object.values(typesMap)];
  };

  const uniqueBusinessTypes = getUniqueBusinessTypes();

  const getLeadsByDayData = () => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      days[dateString] = 0;
    }

    leads.forEach(lead => {
      if (lead.rawDate) {
        const dateString = lead.rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (days[dateString] !== undefined) {
          days[dateString]++;
        }
      }
    });

    return Object.keys(days).map(key => ({ day: key, count: days[key] }));
  };

  const getBusinessTypesData = () => {
    const types: Record<string, number> = {};
    const originalCaseMap: Record<string, string> = {};
    leads.forEach(lead => {
      if (lead.businessType) {
        const cleaned = lead.businessType.trim();
        const lower = cleaned.toLowerCase();
        if (!originalCaseMap[lower]) {
          originalCaseMap[lower] = cleaned;
        }
        types[lower] = (types[lower] || 0) + 1;
      } else {
        types['other'] = (types['other'] || 0) + 1;
        originalCaseMap['other'] = 'Other';
      }
    });

    return Object.keys(types).map(key => ({ name: originalCaseMap[key], value: types[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const leadsByDayData = getLeadsByDayData();
  const businessTypesData = getBusinessTypesData();

  const totalLeads = leads.length;
  
  const leadsThisWeek = leads.filter(l => {
    if (!l.rawDate) return false;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return l.rawDate >= oneWeekAgo;
  }).length;

  const uniqueBusinesses = new Set(leads.map(l => (l.businessType || '').toLowerCase().trim()).filter(Boolean)).size;

  const customStyles = {
    dashboardContainer: {
      minHeight: '100vh',
      backgroundColor: '#030303',
      color: '#ffffff',
      padding: '40px 24px',
      paddingTop: '120px',
      position: 'relative' as const
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      paddingBottom: '24px'
    },
    title: {
      fontSize: '36px',
      fontWeight: '800',
      letterSpacing: '-1px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '24px',
      marginBottom: '40px'
    },
    chartSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
      gap: '30px',
      marginBottom: '50px'
    },
    tableContainer: {
      marginTop: '40px',
      overflowX: 'auto' as const
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      textAlign: 'left' as const
    },
    th: {
      padding: '16px 20px',
      background: 'rgba(255, 255, 255, 0.02)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      color: 'var(--text-secondary)',
      fontSize: '13px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px'
    },
    td: {
      padding: '18px 20px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      fontSize: '14px',
      color: '#e4e4e7'
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#030303'
      }} className="landing-wrapper">
        <div className="typing-dot" style={{ marginRight: '6px' }} /><div className="typing-dot" style={{ marginRight: '6px' }} /><div className="typing-dot" />
        <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '14px' }}>Loading admin authorization...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '20px',
        background: 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 60%)'
      }} className="landing-wrapper">
        <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px', textAlign: 'center' }}>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'linear-gradient(135deg, #9333ea, #ec4899)',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
            }}>
              <ShieldAlert size={32} color="white" />
            </div>
          </div>
          
          <h2 style={{ fontSize: '28px', color: 'white', marginBottom: '8px' }}>Saadhyam AI Admin</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '15px' }}>
            Sign in with your admin credentials.
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Email Address</label>
              <input 
                type="email" 
                required 
                className="input-field" 
                placeholder="admin@saadhyam.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
            </div>
            
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600', marginBottom: '6px', display: 'block' }}>Password</label>
              <input 
                type="password" 
                required 
                className="input-field" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ marginBottom: 0 }}
              />
            </div>

            {loginError && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '20px', fontWeight: '500' }}>
                {loginError}
              </p>
            )}
            
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }}>
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-wrapper" style={customStyles.dashboardContainer}>
      <div className="container">
        
        {/* Header */}
        <div style={customStyles.header} className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(168, 85, 247, 0.1)',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(168, 85, 247, 0.2)'
            }}>
              <Cpu size={24} color="var(--accent-purple)" />
            </div>
            <div>
              <h1 style={{ ...customStyles.title, margin: 0 }}>
                Admin <span className="text-gradient">Dashboard</span>
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Authorized Account: {auth?.currentUser?.email}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }} className="admin-header-actions">
            <button 
              onClick={fetchLeads} 
              className="btn-secondary" 
              style={{ padding: '12px 20px', fontSize: '14px' }}
              disabled={leadsLoading}
            >
              {leadsLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={handleLogout} 
              className="btn-secondary" 
              style={{ 
                padding: '12px 20px', 
                fontSize: '14px',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171' 
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(20, 20, 20, 0.8)';
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div style={customStyles.grid}>
          <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>TOTAL LEADS</span>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '8px', borderRadius: '10px' }}>
                <Users size={18} color="var(--accent-purple)" />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '36px', color: 'white', margin: '8px 0 0 0' }}>{totalLeads}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent-purple)', fontWeight: '600' }}>All-time registered leads</p>
            </div>
          </div>

          <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>NEW LEADS (7D)</span>
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '8px', borderRadius: '10px' }}>
                <Calendar size={18} color="var(--accent-pink)" />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '36px', color: 'white', margin: '8px 0 0 0' }}>{leadsThisWeek}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent-pink)', fontWeight: '600' }}>Submitted in last 7 days</p>
            </div>
          </div>

          <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>UNIQUE BUSINESSES</span>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px' }}>
                <Briefcase size={18} color="var(--accent-blue)" />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '36px', color: 'white', margin: '8px 0 0 0' }}>{uniqueBusinesses}</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--accent-blue)', fontWeight: '600' }}>Unique brands registered</p>
            </div>
          </div>

          <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>SYSTEM HEALTH</span>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px' }}>
                <Check size={18} color="#10b981" />
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '36px', color: '#10b981', margin: '8px 0 0 0' }}>Active</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Firestore sync active</p>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {leads.length > 0 && (
          <div style={customStyles.chartSection} className="admin-charts-grid">
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'white', margin: 0 }}>Registration Trend</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Leads registered per day (Past 7 Days)</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.1)', padding: '4px 10px', borderRadius: '100px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                  <TrendingUp size={14} color="var(--accent-purple)" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-purple)' }}>Live Sync</span>
                </div>
              </div>
              
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leadsByDayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white' 
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Leads" 
                      stroke="var(--accent-purple)" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#111', strokeWidth: 2, stroke: 'var(--accent-purple)' }} 
                      activeDot={{ r: 6, fill: 'var(--accent-pink)', stroke: '#111', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', color: 'white', margin: 0 }}>Business Type Distribution</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Breakdown of early interest categories</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', height: '300px', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={businessTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {businessTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#111', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'white' 
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '150px' }}>
                  {businessTypesData.map((entry, index) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span style={{ fontSize: '13px', color: '#e4e4e7' }}>{entry.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto', fontWeight: '600' }}>({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Database Table Section */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div className="admin-table-controls" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '20px', 
            flexWrap: 'wrap',
            marginBottom: '30px'
          }}>
            <div>
              <h3 style={{ fontSize: '22px', color: 'white', margin: 0 }}>Leads Database</h3>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
                Showing {filteredLeads.length} of {totalLeads} total submissions.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }} className="admin-table-actions">
              <div style={{ position: 'relative' }}>
                <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search leads..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ 
                    padding: '10px 16px 10px 38px', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    fontSize: '14px',
                    width: '240px',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  className="search-input"
                />
              </div>

              <select 
                value={businessFilter} 
                onChange={(e) => setBusinessFilter(e.target.value)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {uniqueBusinessTypes.map(type => (
                  <option key={type} value={type} style={{ background: '#111', color: 'white' }}>
                    {type === 'All' ? 'All Businesses' : type}
                  </option>
                ))}
              </select>

              <button 
                onClick={exportToCSV} 
                className="btn-primary" 
                style={{ padding: '10px 20px', fontSize: '14px', height: '40px' }}
                disabled={filteredLeads.length === 0}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          {leadsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="typing-dot" style={{ marginRight: '6px' }} /><div className="typing-dot" style={{ marginRight: '6px' }} /><div className="typing-dot" />
              <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '14px' }}>Syncing with Firebase Firestore...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              border: '1px dashed rgba(255,255,255,0.08)', 
              borderRadius: '16px',
              color: 'var(--text-secondary)'
            }}>
              <Users size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>No leads match your criteria.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Try clearing your search query or business filter.</p>
            </div>
          ) : (
            <div style={customStyles.tableContainer}>
              <table style={customStyles.table}>
                <thead>
                  <tr>
                    <th style={customStyles.th}>Name</th>
                    <th style={customStyles.th}>Business/Org</th>
                    <th style={customStyles.th}>Contact Info</th>
                    <th style={customStyles.th}>Goals</th>
                    <th style={customStyles.th}>Registered At</th>
                    <th style={{ ...customStyles.th, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="table-row-hover" style={{ transition: 'background-color 0.2s' }}>
                      <td style={customStyles.td}>
                        <div style={{ fontWeight: '600', color: 'white' }}>{lead.name}</div>
                        <span style={{ fontSize: '11px', color: 'var(--accent-lavender)', background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                          ID: {lead.id.slice(0, 6)}...
                        </span>
                      </td>
                      <td style={customStyles.td}>
                        <div style={{ fontWeight: '500', color: '#e4e4e7' }}>{lead.businessType || 'N/A'}</div>
                      </td>
                      <td style={customStyles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Mail size={12} color="var(--text-secondary)" />
                          <a href={`mailto:${lead.email}`} style={{ color: 'var(--accent-blue)', textDecoration: 'none' }}>{lead.email}</a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={12} color="var(--text-secondary)" />
                          <a href={`tel:${lead.phone}`} style={{ color: '#e4e4e7', textDecoration: 'none' }}>{lead.phone}</a>
                        </div>
                      </td>
                      <td style={{ ...customStyles.td, maxWidth: '250px' }}>
                        <div style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          color: '#a1a1aa'
                        }}>
                          {lead.goals || 'No goals specified.'}
                        </div>
                      </td>
                      <td style={customStyles.td}>
                        <div style={{ color: '#e4e4e7' }}>{lead.formattedDate.split(', ')[0]}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{lead.formattedDate.split(', ')[1]}</div>
                      </td>
                      <td style={{ ...customStyles.td, textAlign: 'center' }}>
                        <button 
                          onClick={() => setSelectedLead(lead)} 
                          className="btn-secondary" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            borderRadius: '6px',
                            display: 'inline-flex',
                            gap: '4px',
                            alignItems: 'center' 
                          }}
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Lead Details Modal */}
        {selectedLead && (
          <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '22px', color: 'white', margin: 0 }}>Lead Detailed Profile</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Registered on {selectedLead.formattedDate}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>{selectedLead.name}</div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business / Organization Name</label>
                  <div style={{ color: 'white', fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>{selectedLead.businessType || 'N/A'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</label>
                    <div style={{ marginTop: '4px' }}>
                      <a href={`mailto:${selectedLead.email}`} style={{ color: 'var(--accent-blue)', fontSize: '15px', textDecoration: 'none', fontWeight: '500' }}>{selectedLead.email}</a>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</label>
                    <div style={{ marginTop: '4px' }}>
                      <a href={`tel:${selectedLead.phone}`} style={{ color: 'white', fontSize: '15px', textDecoration: 'none', fontWeight: '500' }}>{selectedLead.phone}</a>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Main Business Goals</label>
                  <div style={{ 
                    color: '#e4e4e7', 
                    fontSize: '14px', 
                    lineHeight: '1.6', 
                    marginTop: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedLead.goals || 'No goals specified.'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead Database ID</label>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace', marginTop: '4px' }}>{selectedLead.id}</div>
                </div>
              </div>

              <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button className="btn-primary" onClick={() => setSelectedLead(null)} style={{ padding: '10px 24px', fontSize: '14px' }}>
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
