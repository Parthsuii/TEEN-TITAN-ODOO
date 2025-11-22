import { useState, useEffect, useContext } from 'react';
import axios from './axios'; 
import { AuthProvider } from './auth/AuthProvider';
import AuthContext from './auth/context';
import Login from './auth/login.jsx';
import { 
  LayoutDashboard, Package, ArrowRightLeft, Plus, Search, Filter, 
  ChevronRight, User, FileText, Truck, MoreHorizontal, Clock, 
  Settings, Menu, LayoutList, LayoutGrid, MapPin, Warehouse, LogOut, ChevronDown
} from 'lucide-react';

// --- 1. MAIN APP WRAPPER ---
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// --- 2. MAIN CONTENT ---
function AppContent() {
  const { user, logout, loading } = useContext(AuthContext);
  const [view, setView] = useState('dashboard'); 
  const [data, setData] = useState({ totalProducts: 0, recentMovements: [], stockLevels: [] });
  
  // State for Profile Dropdown
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const refreshData = () => {
    axios.get('/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => { if(user) refreshData(); }, [user, view]);

  if (loading) return <div className="h-screen bg-[#1e1e1e] flex items-center justify-center text-gray-500">Loading...</div>;
  if (!user) return <Login />;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'receipts', label: 'Operations' },
    { id: 'stock', label: 'Stock' },
    { id: 'history', label: 'Move History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#1e1e1e] font-sans text-gray-100 flex flex-col" onClick={() => setProfileMenuOpen(false)}>
      
      {/* NAV BAR */}
      <nav className="h-14 bg-[#2d2d2d] border-b border-gray-700 flex items-center px-6 justify-between shadow-md z-50 relative">
        
        {/* Left Side */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg tracking-wider">
             <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-black text-xs">SM</div>
             StockMaster
          </div>
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${view === item.id ? 'text-white bg-gray-600' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Profile Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 focus:outline-none group hover:bg-[#383838] p-1.5 rounded-lg transition-colors"
          >
            <div className="text-right hidden md:block">
               <div className="text-white text-sm font-bold group-hover:text-emerald-400 transition-colors">{user.name || 'Admin'}</div>
               <div className="text-gray-500 text-xs">{user.email}</div>
            </div>
            <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center text-xs font-bold text-white border border-gray-600 shadow-sm">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}/>
          </button>

          {/* Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#2d2d2d] border border-gray-700 rounded-xl shadow-2xl py-2 animation-fade-in">
              <div className="px-4 py-3 border-b border-gray-700 mb-1">
                <p className="text-xs text-gray-500 uppercase font-bold">Signed in as</p>
                <p className="text-sm text-white font-medium truncate">{user.email}</p>
              </div>
              
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2 transition-colors">
                <Settings size={16} /> Account Settings
              </button>
              
              <div className="border-t border-gray-700 my-1"></div>
              
              <button 
                onClick={logout} 
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Switch Account
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* CONTENT BODY */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            {view === 'dashboard' && <DashboardView data={data} changeView={setView} />}
            {view === 'stock' && <StockListView stock={data.stockLevels} onCreate={() => setView('products')} />}
            {view === 'receipts' && <OperationView type="IN" refresh={refreshData} />}
            {view === 'deliveries' && <OperationView type="OUT" refresh={refreshData} />}
            {view === 'products' && <ProductManager refresh={refreshData} onBack={() => setView('stock')} />}
            {view === 'history' && <MoveHistoryView movements={data.recentMovements} />}
            {view === 'settings' && <SettingsView />}
        </div>
      </main>
    </div>
  );
}

// --- COMPONENTS (Unchanged) ---

function DashboardView({ data, changeView }) {
  const receiptsCount = data.recentMovements.filter(m => m.type === 'IN').length;
  const deliveryCount = data.recentMovements.filter(m => m.type === 'OUT').length;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
      <DashboardCard title="Receipts" count={receiptsCount} actionLabel="To Receive" color="emerald" onClick={() => changeView('receipts')} stats={[{label: '1 Late', urgent: true}, {label: '6 Operations'}]} />
      <DashboardCard title="Delivery Orders" count={deliveryCount} actionLabel="To Deliver" color="blue" onClick={() => changeView('deliveries')} stats={[{label: '1 Late', urgent: true}, {label: '2 Waiting'}, {label: 'Whole Weasel'}]} />
    </div>
  );
}

function DashboardCard({ title, count, actionLabel, color, onClick, stats }) {
  const borderColor = color === 'emerald' ? 'hover:border-emerald-500' : 'hover:border-blue-500';
  const textColor = color === 'emerald' ? 'text-emerald-400' : 'text-blue-400';
  const btnColor = color === 'emerald' ? 'border-emerald-600 text-emerald-400 hover:bg-emerald-600' : 'border-blue-600 text-blue-400 hover:bg-blue-600';
  return (
    <div className={`bg-[#2d2d2d] rounded-xl border border-gray-600 p-6 shadow-lg transition-all group ${borderColor}`}>
      <div className="flex justify-between items-start mb-6"><h3 className={`text-xl font-bold ${textColor}`}>{title}</h3><MoreHorizontal className="text-gray-500 cursor-pointer hover:text-white"/></div>
      <div className="flex items-start gap-8"><button onClick={onClick} className={`bg-[#1e1e1e] border hover:text-white transition-all px-6 py-3 rounded rounded-lg font-bold text-lg shadow-md uppercase ${btnColor}`}>{count} {actionLabel}</button>
      <div className="flex flex-col gap-1 pt-1">{stats.map((s, i) => (<div key={i} className={`font-medium text-sm cursor-pointer hover:underline ${s.urgent ? 'text-orange-400' : 'text-gray-400 hover:text-white'}`}>{s.label}</div>))}</div></div>
    </div>
  );
}

function OperationView({ type, refresh }) {
  const [viewState, setViewState] = useState('list');
  const [movements, setMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => { 
    axios.get('/dashboard').then(res => { 
        setMovements(res.data.recentMovements.filter(m => m.type === type)); 
    }); 
  }, [type]);

  const filteredList = movements.filter(m => (m.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.partner || '').toLowerCase().includes(searchTerm.toLowerCase()));
  
  if (viewState === 'form') return <OperationForm type={type} onCancel={() => setViewState('list')} onSuccess={() => { refresh(); setViewState('list'); }} />;
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 bg-[#2d2d2d] p-3 rounded-lg border border-gray-700 shadow-sm">
        <div className="flex items-center gap-6"><button onClick={() => setViewState('form')} className="border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-black px-5 py-1.5 rounded uppercase text-sm font-bold tracking-wide transition-colors">New</button><h2 className="text-xl text-white font-medium">{type === 'IN' ? 'Receipts' : 'Delivery Orders'}</h2></div>
        <div className="flex items-center gap-3"><div className="relative group"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#1e1e1e] border border-gray-600 text-gray-300 text-sm rounded-md pl-3 pr-10 py-1.5 focus:border-emerald-500 outline-none w-64 transition-all" /><Search className="absolute right-3 top-2 text-gray-500 w-4 h-4 group-hover:text-emerald-400" /></div><div className="flex bg-[#1e1e1e] rounded border border-gray-600 p-0.5"><button className="p-1.5 bg-gray-600 text-white rounded shadow-sm"><LayoutList size={18}/></button><button className="p-1.5 text-gray-500 hover:text-white"><LayoutGrid size={18}/></button></div></div>
      </div>
      <div className="bg-[#2d2d2d] rounded-lg border border-gray-700 overflow-hidden shadow-lg flex-1"><table className="w-full text-left text-sm text-gray-300"><thead className="bg-[#2d2d2d] border-b border-gray-600 text-gray-400 uppercase font-bold text-xs"><tr><th className="p-4 border-r border-gray-700 w-32">Reference</th><th className="p-4 border-r border-gray-700">From</th><th className="p-4 border-r border-gray-700">To</th><th className="p-4 border-r border-gray-700">Contact</th><th className="p-4 border-r border-gray-700 w-32">Schedule Date</th><th className="p-4 text-center w-24">Status</th></tr></thead><tbody className="divide-y divide-gray-700">{filteredList.map(m => (<tr key={m.id} className="hover:bg-[#383838] transition-colors cursor-pointer group"><td className="p-4 font-bold text-white border-r border-gray-700">{m.reference || 'DRAFT'}</td><td className="p-4 border-r border-gray-700">{m.fromLocation?.name || 'Partner'}</td><td className="p-4 border-r border-gray-700">{m.toLocation?.name || 'Partner'}</td><td className="p-4 text-emerald-400 border-r border-gray-700 group-hover:text-emerald-300">{m.partner || '-'}</td><td className="p-4 border-r border-gray-700 text-gray-400">{new Date(m.createdAt).toLocaleDateString()}</td><td className="p-4 text-center"><span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Ready</span></td></tr>))}</tbody></table></div>
    </div>
  );
}

function OperationForm({ type, onCancel, onSuccess }) {
  const [form, setForm] = useState({ type, productId: '', quantity: 1, fromId: '', toId: '', partner: '', reference: '' });
  const [locations, setLocations] = useState([]);
  useEffect(() => { axios.get('/locations').then(res => setLocations(res.data)); }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.type === 'IN' && !form.toId) return alert("Select Destination");
    if (form.type === 'OUT' && !form.fromId) return alert("Select Source");
    try { await axios.post('/movements', { ...form, toLocationId: form.toId || null, fromLocationId: form.fromId || null }); alert('Saved!'); onSuccess(); } catch (err) { alert(err.message); }
  };
  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-gray-700 max-w-5xl mx-auto p-8 shadow-xl">
      <div className="flex justify-between items-center mb-8 border-b border-gray-600 pb-4"><div><div className="text-emerald-500 text-sm font-bold uppercase mb-1">New {type === 'IN' ? 'Receipt' : 'Delivery'}</div><h2 className="text-2xl font-bold text-white">Draft / {type}0001</h2></div><div className="flex gap-3"><button onClick={onCancel} className="px-5 py-2 border border-gray-500 text-gray-300 hover:bg-gray-700 rounded transition">Discard</button><button onClick={handleSubmit} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-lg transition">Validate</button></div></div>
      <div className="grid grid-cols-2 gap-12 mb-8"><div className="space-y-6"><div className="group"><label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-emerald-500 transition-colors">Partner</label><input className="w-full bg-[#1e1e1e] border-b border-gray-600 p-2 text-white focus:border-emerald-500 outline-none transition-all placeholder-gray-600" placeholder="Select Partner..." onChange={e => setForm({...form, partner: e.target.value})}/></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Operation Type</label><div className="text-white font-medium pl-2">{type === 'IN' ? 'Receipts' : 'Delivery Orders'}</div></div></div><div className="space-y-6"><div className="group"><label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-emerald-500 transition-colors">Reference</label><input className="w-full bg-[#1e1e1e] border-b border-gray-600 p-2 text-white focus:border-emerald-500 outline-none transition-all placeholder-gray-600" placeholder="e.g. PO00012" onChange={e => setForm({...form, reference: e.target.value})}/></div><div className="group"><label className="block text-xs font-bold text-gray-500 uppercase mb-2 group-focus-within:text-emerald-500 transition-colors">{type === 'IN' ? 'Destination' : 'Source'}</label><select className="w-full bg-[#1e1e1e] border-b border-gray-600 p-2 text-white focus:border-emerald-500 outline-none" onChange={e => type==='IN' ? setForm({...form, toId: e.target.value}) : setForm({...form, fromId: e.target.value})}><option value="">Select Location...</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div></div></div>
      <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Operations</h3><table className="w-full text-left text-sm text-gray-300"><thead className="text-gray-500 font-bold text-xs uppercase"><tr><th className="p-2 w-3/4">Product</th><th className="p-2 text-right">Demand</th></tr></thead><tbody><tr><td className="p-2"><input className="w-full bg-transparent border-b border-gray-700 focus:border-emerald-500 outline-none text-white placeholder-gray-600" placeholder="Product UUID" onChange={e => setForm({...form, productId: e.target.value})}/></td><td className="p-2"><input type="number" className="w-full bg-transparent border-b border-gray-700 focus:border-emerald-500 outline-none text-white text-right" defaultValue={1} onChange={e => setForm({...form, quantity: e.target.value})}/></td></tr></tbody></table>
    </div>
  );
}

function StockListView({ stock, onCreate }) {
  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-gray-700 overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#333]"><h3 className="font-bold text-gray-200">Current Stock</h3><button onClick={onCreate} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2"><Plus size={16} /> New Product</button></div>
      <table className="w-full text-left text-sm text-gray-300"><thead className="bg-[#262626] text-gray-500 uppercase font-bold text-xs"><tr><th className="p-4">Product</th><th className="p-4">SKU</th><th className="p-4">Location</th><th className="p-4 text-right">Qty</th></tr></thead><tbody className="divide-y divide-gray-700">{stock.map(item => (<tr key={item.id} className="hover:bg-[#383838]"><td className="p-4 font-medium text-white">{item.product.name}</td><td className="p-4 text-gray-400">{item.product.sku}</td><td className="p-4 text-gray-400">{item.location.name}</td><td className="p-4 text-right font-bold text-emerald-400">{item.quantity}</td></tr>))}</tbody></table>
    </div>
  );
}

function MoveHistoryView({ movements }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredMoves = movements.filter(m => (m.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.partner || '').toLowerCase().includes(searchTerm.toLowerCase()));
  return (
    <div className="flex flex-col h-full"><div className="flex justify-between items-center mb-4 bg-[#2d2d2d] p-3 rounded-lg border border-gray-700 shadow-sm"><div className="flex items-center gap-6"><button className="border border-gray-600 text-gray-400 px-5 py-1.5 rounded uppercase text-sm font-bold tracking-wide cursor-not-allowed opacity-50">New</button><h2 className="text-xl text-white font-medium text-pink-300">Move History</h2></div><div className="flex items-center gap-3"><div className="relative group"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#1e1e1e] border border-gray-600 text-gray-300 text-sm rounded-md pl-3 pr-10 py-1.5 focus:border-pink-500 outline-none w-64 transition-all" /><Search className="absolute right-3 top-2 text-gray-500 w-4 h-4 group-hover:text-pink-400" /></div><div className="flex bg-[#1e1e1e] rounded border border-gray-600 p-0.5"><button className="p-1.5 bg-gray-600 text-white rounded shadow-sm"><LayoutList size={18}/></button><button className="p-1.5 text-gray-500 hover:text-white"><LayoutGrid size={18}/></button></div></div></div><div className="bg-[#2d2d2d] rounded-lg border border-gray-700 overflow-hidden shadow-lg flex-1"><table className="w-full text-left text-sm text-gray-300"><thead className="bg-[#2d2d2d] border-b border-gray-600 text-gray-400 uppercase font-bold text-xs"><tr><th className="p-4 border-r border-gray-700 w-32">Reference</th><th className="p-4 border-r border-gray-700">Date</th><th className="p-4 border-r border-gray-700">Contact</th><th className="p-4 border-r border-gray-700">From</th><th className="p-4 border-r border-gray-700">To</th><th className="p-4 border-r border-gray-700 text-right w-24">Quantity</th><th className="p-4 text-center w-24">Status</th></tr></thead><tbody className="divide-y divide-gray-700">{filteredMoves.length === 0 ? (<tr><td colSpan="7" className="p-10 text-center text-gray-500 italic">No history found matching your search.</td></tr>) : (filteredMoves.map(m => (<tr key={m.id} className="hover:bg-[#383838] transition-colors cursor-pointer"><td className="p-4 font-mono text-white border-r border-gray-700">{m.reference || '-'}</td><td className="p-4 border-r border-gray-700">{new Date(m.createdAt).toLocaleDateString()}</td><td className="p-4 text-blue-300 border-r border-gray-700">{m.partner || '-'}</td><td className="p-4 border-r border-gray-700">{m.fromLocation?.name || 'Partner'}</td><td className="p-4 border-r border-gray-700">{m.toLocation?.name || 'Partner'}</td><td className={`p-4 border-r border-gray-700 text-right font-bold ${m.type === 'IN' ? 'text-emerald-400' : 'text-red-400'}`}>{m.type === 'IN' ? '+' : '-'}{m.quantity}</td><td className="p-4 text-center"><span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ready</span></td></tr>)))}</tbody></table></div></div>
  );
}

function ProductManager({ refresh, onBack }) {
    const [name, setName] = useState(''); const [sku, setSku] = useState('');
    const create = async () => { await axios.post('/products', { name, sku, category: 'General' }); alert('Created'); refresh(); };
    return (<div className="bg-[#2d2d2d] rounded-lg border border-gray-700 max-w-md mx-auto p-6 mt-10"><h2 className="text-xl font-bold text-white mb-4">Create Product</h2><div className="space-y-4"><input className="w-full bg-[#1e1e1e] border border-gray-600 rounded p-2 text-white outline-none focus:border-emerald-500" placeholder="Product Name" onChange={e => setName(e.target.value)}/><input className="w-full bg-[#1e1e1e] border border-gray-600 rounded p-2 text-white outline-none focus:border-emerald-500" placeholder="SKU" onChange={e => setSku(e.target.value)}/><button onClick={create} className="w-full bg-emerald-600 text-white p-2 rounded font-bold hover:bg-emerald-500">Save</button><button onClick={onBack} className="w-full text-gray-400 text-sm hover:text-white mt-2">Cancel</button></div></div>)
}

function SettingsView() {
  const [activeTab, setActiveTab] = useState('warehouse');
  return (
    <div className="max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-normal text-white mb-6 border-b border-gray-700 pb-2">ADD NEW DETAILS</h2>
      <div className="flex gap-6 mb-8"><button onClick={() => setActiveTab('warehouse')} className={`flex items-center gap-3 px-6 py-4 rounded-lg border transition-all ${activeTab === 'warehouse' ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : 'bg-[#2d2d2d] border-gray-700 text-gray-400 hover:border-gray-500'}`}><Warehouse size={24} /><div className="text-left"><div className="font-bold text-lg">Warehouse</div><div className="text-xs opacity-70">Manage physical buildings</div></div></button><button onClick={() => setActiveTab('location')} className={`flex items-center gap-3 px-6 py-4 rounded-lg border transition-all ${activeTab === 'location' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-[#2d2d2d] border-gray-700 text-gray-400 hover:border-gray-500'}`}><MapPin size={24} /><div className="text-left"><div className="font-bold text-lg">Location</div><div className="text-xs opacity-70">Manage racks, zones, bins</div></div></button></div>
      {activeTab === 'warehouse' ? <WarehouseForm /> : <LocationForm />}
    </div>
  );
}

function WarehouseForm() {
  const [name, setName] = useState(''); const [shortCode, setShortCode] = useState(''); const [address, setAddress] = useState('');
  const save = async () => { if(!name) return alert("Name is required"); await axios.post('/locations', { name, type: 'warehouse', address }); alert('Warehouse Saved!'); setName(''); setShortCode(''); setAddress(''); };
  return (<div className="bg-[#2d2d2d] rounded-xl border border-gray-700 p-8 shadow-lg"><h3 className="text-xl font-bold text-pink-300 mb-6">Warehouse</h3><div className="space-y-8 max-w-lg"><div className="space-y-1"><label className="text-pink-200 text-sm font-bold uppercase">Name:</label><input className="w-full bg-transparent border-b border-gray-600 focus:border-pink-400 outline-none py-2 text-white placeholder-gray-600" placeholder="e.g. Central Station" value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-1"><label className="text-pink-200 text-sm font-bold uppercase">Short Code:</label><input className="w-full bg-transparent border-b border-gray-600 focus:border-pink-400 outline-none py-2 text-white placeholder-gray-600" placeholder="e.g. WH01" value={shortCode} onChange={e => setShortCode(e.target.value)} /></div><div className="space-y-1"><label className="text-pink-200 text-sm font-bold uppercase">Address:</label><input className="w-full bg-transparent border-b border-gray-600 focus:border-pink-400 outline-none py-2 text-white placeholder-gray-600" placeholder="e.g. 123 Main St, New York" value={address} onChange={e => setAddress(e.target.value)} /></div><div className="pt-4"><button onClick={save} className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-2 rounded font-bold shadow-md transition-transform active:scale-95">Save</button></div></div></div>);
}

function LocationForm() {
  const [name, setName] = useState(''); const [shortCode, setShortCode] = useState(''); const [warehouse, setWarehouse] = useState(''); const [warehouses, setWarehouses] = useState([]);
  useEffect(() => { axios.get('/locations').then(res => setWarehouses(res.data)); }, []);
  const save = async () => { if(!name) return alert("Name is required"); await axios.post('/locations', { name, type: 'location', address: warehouse }); alert('Location Saved!'); setName(''); setShortCode(''); };
  return (<div className="bg-[#2d2d2d] rounded-xl border border-gray-700 p-8 shadow-lg"><h3 className="text-xl font-bold text-purple-300 mb-6">Location</h3><div className="space-y-8 max-w-lg"><div className="space-y-1"><label className="text-purple-200 text-sm font-bold uppercase">Name:</label><input className="w-full bg-transparent border-b border-gray-600 focus:border-purple-400 outline-none py-2 text-white placeholder-gray-600" placeholder="e.g. Shelf A" value={name} onChange={e => setName(e.target.value)} /></div><div className="space-y-1"><label className="text-purple-200 text-sm font-bold uppercase">Short Code:</label><input className="w-full bg-transparent border-b border-gray-600 focus:border-purple-400 outline-none py-2 text-white placeholder-gray-600" placeholder="e.g. LOC-A" value={shortCode} onChange={e => setShortCode(e.target.value)} /></div><div className="space-y-1"><label className="text-purple-200 text-sm font-bold uppercase">Warehouse:</label><select className="w-full bg-[#2d2d2d] border-b border-gray-600 focus:border-purple-400 outline-none py-2 text-white" value={warehouse} onChange={e => setWarehouse(e.target.value)}><option value="">Select Warehouse...</option>{warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}</select></div><div className="pt-4"><button onClick={save} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-2 rounded font-bold shadow-md transition-transform active:scale-95">Save</button></div></div><p className="mt-8 text-gray-500 text-sm italic">This holds the multiple locations of warehouse, rooms etc..</p></div>);
}