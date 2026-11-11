import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Wallet({ user }) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState('deposit'); // 'deposit' (ገንዘብ ማስገባት) ወይም 'withdraw' (ማውጣት)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, []);

  const fetchBalance = async () => {
    const { data } = await supabase.rpc('get_player_balance', { p_user_id: user.id });
    setBalance(data || 0);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('deposits_withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setHistory(data || []);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (amount < 10) return setMessage("❌ ቢያንስ 10 ETB መሆን አለበት።");
    if (type === 'withdraw' && amount > balance) return alert("❌ ባላንስህ ከጠየቁት ገንዘብ ያንሳል!");
    
    setLoading(true);
    setMessage('');

    // 1. ጥያቄውን ወደ ዳታቤዝ መመዝገብ
    const { error } = await supabase.from('deposits_withdrawals').insert([{
      user_id: user.id,
      amount: amount,
      type: type,
      status: 'pending'
    }]);

    if (error) {
      setMessage("❌ ስህተት ተፈጥሯል። እንደገና ሞክር።");
    } else {
      setMessage(`✅ የ${type === 'deposit' ? 'ገንዘብ ማስገባት' : 'ገንዘብ ማውጣት'} ጥያቄዎ በተሳካ ሁኔታ ተልኳል!`);
      setAmount(100);
      fetchBalance();
      fetchHistory();
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '15px', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/*  തലጌ (Header & Balance) */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center', border: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#aaa' }}>የእርስዎ የኪስ ቦርሳ (Wallet)</h3>
        <h1 style={{ margin: 0, color: '#ffc107', fontSize: '32px' }}>{balance.toFixed(2)} ETB</h1>
      </div>

      {/* የጥያቄ ማቅረቢያ ፎርም */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #333' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>ገንዘብ ያስገቡ / ያውጡ</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button 
            type="button" 
            onClick={() => setType('deposit')} 
            style={{ flex: 1, padding: '10px', backgroundColor: type === 'deposit' ? '#4CAF50' : '#333', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            ገንዘብ ማስገባት (Deposit)
          </button>
          <button 
            type="button" 
            onClick={() => setType('withdraw')} 
            style={{ flex: 1, padding: '10px', backgroundColor: type === 'withdraw' ? '#f44336' : '#333', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
            ገንዘብ ማውጣት (Withdraw)
          </button>
        </div>

        <form onSubmit={handleRequest}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#bbb' }}>መጠን (ETB)</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))} 
            style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '16px', marginBottom: '10px', boxSizing: 'border-box' }} 
          />

          {/* ፈጣን የምርጫ አቋራጮች */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            {[100, 500, 1000, 5000].map((amt) => (
              <button 
                key={amt} 
                type="button" 
                onClick={() => setAmount(amt)} 
                style={{ padding: '6px 12px', backgroundColor: amount === amt ? '#ffc107' : '#333', color: amount === amt ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                {amt}
              </button>
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{ width: '100%', padding: '12px', backgroundColor: type === 'deposit' ? '#4CAF50' : '#f44336', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            {loading ? 'በመላክ ላይ...' : type === 'deposit' ? 'ጥያቄ ላክ (Deposit)' : 'ማውጣት ጥያቄ ላክ (Withdraw)'}
          </button>
        </form>

        {message && <p style={{ marginTop: '15px', textAlign: 'center', fontWeight: 'bold' }}>{message}</p>}
      </div>

      {/* የክፍያ ታሪክ (History) */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>የክፍያ ታሪክ</h3>
        {history.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center' }}>ምንም የግብይት ታሪክ የለም።</p>
        ) : (
          history.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #333', fontSize: '14px' }}>
              <div>
                <span style={{ color: item.type === 'deposit' ? '#4CAF50' : '#f44336', fontWeight: 'bold' }}>
                  {item.type === 'deposit' ? '📥 ማስገባት' : '📤 ማውጣት'}
                </span>
                <p style={{ margin: '3px 0 0 0', color: '#aaa', fontSize: '12px' }}>{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <b style={{ color: '#fff' }}>{item.amount} ETB</b>
                <p style={{ margin: '3px 0 0 0', color: item.status === 'approved' ? '#4CAF50' : item.status === 'rejected' ? '#f44336' : '#ffc107', fontSize: '12px', textTransform: 'uppercase' }}>
                  {item.status}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
