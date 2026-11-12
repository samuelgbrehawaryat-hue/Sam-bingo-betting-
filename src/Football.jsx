import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Football({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(50);
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' ወይም 'history'
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBalance();
    fetchMatches();
    fetchHistory();
  }, []);

  const fetchBalance = async () => {
    if (!supabase || !user?.id) return;
    const { data } = await supabase.rpc('get_player_balance', { p_user_id: user.id });
    setBalance(data || 0);
  };

  const fetchMatches = async () => {
    setLoading(true);
    // ሁሉንም ግጥሚያዎች ከዳታቤዝ ማምጣት
    const { data, error } = await supabase
      .from('football_matches')
      .select('*');

    if (error) {
      console.log("Error fetching matches:", error.message);
    } else {
      setMatches(data || []);
    }
    setLoading(false);
  };

  const fetchHistory = async () => {
    if (!supabase || !user?.id) return;
    const { data } = await supabase
      .from('football_bets')
      .select('*, football_matches(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setHistory(data || []);
  };

  const placeBet = async (matchId, prediction, odds) => {
    if (amount <= 0) return alert("እባክዎ ትክክለኛ የውርርድ መጠን ያስገቡ።");
    if (amount > balance) return alert("❌ ባላንስዎ በቂ አይደለም!");

    setMessage('ውርርድ በመመዝገብ ላይ...');

    const { error } = await supabase.from('football_bets').insert([{
      user_id: user.id,
      match_id: matchId,
      prediction: prediction,
      amount: amount,
      odds: odds,
      status: 'pending'
    }]);

    if (error) {
      setMessage("❌ ውርርዱን መመዝገብ አልተቻለም።");
    } else {
      // ከባላንስ ላይ መቀነስ
      await supabase.rpc('deduct_balance', { p_user_id: user.id, p_amount: amount });
      setMessage("✅ ውርርዱ ተሳክቷል!");
      fetchBalance();
      fetchHistory();
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', padding: '15px', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* ⚽  തലጌ (Header & Balance) */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', border: '1px solid #333' }}>
        <div>
          <h2 style={{ margin: 0, color: '#ffc107', fontSize: '20px' }}>⚽ የውርርድ ማዕከል</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: '#aaa' }}>ባላንስ:-</span>
          <h3 style={{ margin: 0, color: '#ffc107' }}>{balance.toFixed(2)} ETB</h3>
        </div>
      </div>

      {/* የታብ መቀየሪያ */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('matches')} style={{ flex: 1, padding: '10px', backgroundColor: activeTab === 'matches' ? '#ffc107' : '#222', color: activeTab === 'matches' ? '#000' : '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          የዕለቱ ጨዋታዎች
        </button>
        <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '10px', backgroundColor: activeTab === 'history' ? '#ffc107' : '#222', color: activeTab === 'history' ? '#000' : '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          የውርርድ ታሪክ ({history.length})
        </button>
      </div>

      {/* የውርርድ መጠን መምረጫ */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #333' }}>
        <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '5px' }}>የውርርድ መጠን (ETB):-</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))} 
            style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '16px' }} 
          />
          {[50, 100, 250, 500].map((amt) => (
            <button key={amt} type="button" onClick={() => setAmount(amt)} style={{ padding: '8px 12px', backgroundColor: amount === amt ? '#ffc107' : '#333', color: amount === amt ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {amt}
            </button>
          ))}
        </div>
      </div>

      {message && <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#ffc107' }}>{message}</p>}

      {/* የጨዋታዎች ዝርዝር */}
      {activeTab === 'matches' && (
        <div>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>ጨዋታዎችን በመጫን ላይ...</p>
          ) : matches.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>አሁን ምንም የሚጫወቱ ጨዋታዎች የሉም።</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matches.map((match) => (
                <div key={match.id} style={{ backgroundColor: '#1e1e1e', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '11px', color: '#ffc107', textTransform: 'uppercase' }}>🏆 {match.league || 'General'}</p>
                  <h4 style={{ textAlign: 'center', margin: '0 0 12px 0', fontSize: '16px' }}>{match.home_team} vs {match.away_team}</h4>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => placeBet(match.id, 'home_win', match.odds_home || 2.0)} style={{ flex: 1, padding: '10px 5px', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#aaa' }}>1 (W1)</div>
                      <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>{match.odds_home || 2.0}</div>
                    </button>
                    <button onClick={() => placeBet(match.id, 'draw', match.odds_draw || 3.0)} style={{ flex: 1, padding: '10px 5px', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#aaa' }}>X (Draw)</div>
                      <div style={{ fontWeight: 'bold', color: '#ff9800' }}>{match.odds_draw || 3.0}</div>
                    </button>
                    <button onClick={() => placeBet(match.id, 'away_win', match.odds_away || 2.5)} style={{ flex: 1, padding: '10px 5px', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px', color: '#fff', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#aaa' }}>2 (W2)</div>
                      <div style={{ fontWeight: 'bold', color: '#2196F3' }}>{match.odds_away || 2.5}</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* የውርርድ ታሪክ */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#aaa' }}>ምንም የውርርድ ታሪክ የለም።</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((bet) => (
                <div key={bet.id} style={{ backgroundColor: '#1e1e1e', padding: '12px', borderRadius: '8px', border: '1px solid #333', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <b style={{ color: '#fff' }}>{bet.football_matches ? `${bet.football_matches.home_team} vs ${bet.football_matches.away_team}` : 'ጨዋታ'}</b>
                    <span style={{ color: bet.status === 'won' ? '#4CAF50' : bet.status === 'lost' ? '#f44336' : '#ffc107', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '12px' }}>{bet.status}</span>
                  </div>
                  <p style={{ margin: '3px 0', color: '#aaa', fontSize: '12px' }}>ምርጫ: {bet.prediction} (Odds: {bet.odds})</p>
                  <p style={{ margin: '3px 0', color: '#ffc107', fontWeight: 'bold' }}>መጠን: {bet.amount} ETB</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
