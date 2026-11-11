import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Wallet({ user }) {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState(100);
  const [type, setType] = useState('deposit');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    const { data } = await supabase.rpc('get_player_balance', { p_user_id: user.id });
    setBalance(data || 0);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (amount < 10) return setMessage("ቢያንስ 10 ETB ማስገባት አለብህ።");
    
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
      setMessage("ስህተት ተፈጥሯል። እንደገና ሞክር።");
    } else {
      setMessage(`የ${type === 'deposit' ? 'ማስገቢያ' : 'ማውጫ'} ጥያቄህ ተልኳል! አስተዳዳሪው ሲያጸድቀው ባላንስህ ይለወጣል።`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* የባላንስ ማሳያ */}
      <div style={{ backgroundColor: '#1e1e1e', color: '#4CAF50', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px', border: '1px solid #333' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>የአሁኑ ባላንስህ</h3>
        <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{balance.toFixed(2)} ETB</h1>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', color: '#000' }}>
        <h3>💰 ገንዘብ ማስገባት / ማውጣት</h3>
        
        {/* የክፍያ መንገዶች መረጃ */}
        <div style={{ backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', borderLeft: '4px solid #2196F3' }}>
          <p style={{ margin: '0 0 5px 0' }}><strong>📌 የማስገቢያ መንገዶች፦</strong></p>
          <p style={{ margin: '0' }}>📱 CBE Birr / Telebirr: <strong>098 397 6380</strong></p>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}><i>ገንዘብ ካስገባህ በኋላ የደረሰኙን (Screenshot) አስቀምጠህ ትርፍ ላይ ያለውን ያረጋግጥ።</i></p>
        </div>

        <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>አይነት ምረጥ፦</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px' }}>
              <option value="deposit">ገንዘብ አስገባ (Deposit)</option>
              <option value="withdrawal">ገንዘብ አውጣ (Withdraw)</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 'bold' }}>መጠን (ETB)፦</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'በመላክ ላይ...' : 'ጥያቄ አስገባ'}
          </button>
        </form>

        {message && <p style={{ marginTop: '15px', color: message.includes('ተልኳል') ? 'green' : 'red', textAlign: 'center' }}>{message}</p>}
      </div>
    </div>
  );
}
