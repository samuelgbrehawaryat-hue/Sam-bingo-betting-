import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Football({ user }) {
  const [matches, setMatches] = useState([]);
  const [myBets, setMyBets] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState({});
  const [betAmount, setBetAmount] = useState(50);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' ወይም 'history'

  useEffect(() => {
    fetchMatches();
    fetchBalance();
    fetchMyBets();
  }, []);

  const fetchBalance = async () => {
    const { data } = await supabase.rpc('get_player_balance', { p_user_id: user.id });
    setBalance(data || 0);
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data } = await supabase.from('football_matches').select('*').eq('status', 'upcoming');
    setMatches(data || []);
    setLoading(false);
  };

  const fetchMyBets = async () => {
    const { data } = await supabase
      .from('football_bets')
      .select('*, football_matches(home_team, away_team, league)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setMyBets(data || []);
  };

  const handleSelectBet = (matchId, prediction, odds) => {
    setSelectedBets({ ...selectedBets, [matchId]: { prediction, odds } });
  };

  const placeBet = async (match) => {
    const bet = selectedBets[match.id];
    if (!bet) return alert("እባክህ መጀመሪያ ውጤት ምረጥ!");
    if (betAmount > balance) return alert("❌ ባላንስህ አይበቃም! እባክህ ገንዘብ አስገባ።");
    if (betAmount <= 0) return alert("ትክክለኛ መጠን አስገባ!");

    setLoading(true);

    // 1. ገንዘቡን ከባላንስ መቀነስ
    const { data: success, error: deductError } = await supabase.rpc('deduct_balance', { p_user_id: user.id, p_amount: betAmount });

    if (deductError || !success) {
      alert("ባላንስ መቀነስ አልተቻለም። እንደገና ሞክር።");
      setLoading(false);
      return;
    }

    // 2. ውርርዱን በዳታቤዝ ውስጥ መመዝገብ
    const { error: betError } = await supabase.from('football_bets').insert([{
      user_id: user.id,
      match_id: match.id,
      prediction: bet.prediction,
      amount: betAmount,
      odds: bet.odds,
      status: 'pending'
    }]);

    if (betError) {
      alert("ውርርድ መመዝገብ አልተቻለም።");
    } else {
      alert(`✅ ውርርድዎ ተቀብሏል! ${betAmount} ETB ተቀንሷል።`);
      setSelectedBets({ ...selectedBets, [match.id]: null });
      fetchBalance();
      fetchMyBets();
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', paddingBottom: '50px', fontFamily: 'sans-serif', color: '#fff' }}>
      
      {/* ሪፖርት ወይም ታላይ (Header) */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <h2 style={{ margin: 0, color: '#ffc107' }}>⚽ የውርርድ ማዕከል</h2>
        <div style={{ backgroundColor: '#ffc107', color: '#000', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' }}>
          ባላንስ፦ {balance.toFixed(2)} ETB
        </div>
      </div>

      {/* ታብ ማስተላለፊያ (Tabs: ጨዋታዎች vs የኔ ውርርዶች) */}
      <div style={{ display: 'flex', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' }}>
        <button 
          onClick={() => setActiveTab('matches')} 
          style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'matches' ? '#ffc107' : '#aaa', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'matches' ? '2px solid #ffc107' : 'none' }}>
          የዛሬ ጨዋታዎች
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeTab === 'history' ? '#ffc107' : '#aaa', fontWeight: 'bold', cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid #ffc107' : 'none' }}>
          የውርርድ ታሪክ ({myBets.length})
        </button>
      </div>

      {activeTab === 'matches' ? (
        <>
          {/* የውርርድ መጠን መምረጫ */}
          <div style={{ padding: '15px', backgroundColor: '#181818', margin: '15px', borderRadius: '10px' }}>
            <label style={{ fontWeight: 'bold', color: '#ddd', display: 'block', marginBottom: '8px' }}>የውርርድ መጠን (ETB)፦ </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="number" 
                value={betAmount} 
                onChange={(e) => setBetAmount(Number(e.target.value))} 
                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', width: '100px', fontSize: '16px' }} 
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                {[50, 100, 250, 500].map((amt) => (
                  <button key={amt} onClick={() => setBetAmount(amt)} style={{ padding: '8px 12px', backgroundColor: betAmount === amt ? '#ffc107' : '#333', color: betAmount === amt ? '#000' : '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* የጨዋታዎች ዝርዝር */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#888' }}>በመጫን ላይ...</p>
          ) : matches.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>አሁን ምንም የሚጫወቱ ጨዋታዎች የሉም።</p>
          ) : (
            <div style={{ padding: '0 15px' }}>
              {matches.map((match) => (
                <div key={match.id} style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', marginBottom: '15px', padding: '15px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
                    <span>🏆 {match.league}</span>
                    <span>🕒 ዛሬ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>
                    <span>{match.home_team}</span>
                    <span style={{ color: '#666' }}>VS</span>
                    <span>{match.away_team}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleSelectBet(match.id, 'home_win', match.odds_home)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedBets[match.id]?.prediction === 'home_win' ? '#ffc107' : '#2a2a2a', color: selectedBets[match.id]?.prediction === 'home_win' ? '#000' : '#fff' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: selectedBets[match.id]?.prediction === 'home_win' ? '#333' : '#aaa' }}>W1</span>
                      {match.odds_home.toFixed(2)}
                    </button>
                    <button onClick={() => handleSelectBet(match.id, 'draw', match.odds_draw)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedBets[match.id]?.prediction === 'draw' ? '#ffc107' : '#2a2a2a', color: selectedBets[match.id]?.prediction === 'draw' ? '#000' : '#fff' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: selectedBets[match.id]?.prediction === 'draw' ? '#333' : '#aaa' }}>X</span>
                      {match.odds_draw.toFixed(2)}
                    </button>
                    <button onClick={() => handleSelectBet(match.id, 'away_win', match.odds_away)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedBets[match.id]?.prediction === 'away_win' ? '#ffc107' : '#2a2a2a', color: selectedBets[match.id]?.prediction === 'away_win' ? '#000' : '#fff' }}>
                      <span style={{ display: 'block', fontSize: '10px', color: selectedBets[match.id]?.prediction === 'away_win' ? '#333' : '#aaa' }}>W2</span>
                      {match.odds_away.toFixed(2)}
                    </button>
                  </div>
                  {selectedBets[match.id] && (
                    <button onClick={() => placeBet(match)} style={{ width: '100%', marginTop: '12px', padding: '12px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                      ውረድ (Bet {betAmount} ETB - ሊያወጣ የሚችለው: {(betAmount * selectedBets[match.id].odds).toFixed(2)} ETB)
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* የውርርድ ታሪክ ማሳያ ክፍል */
        <div style={{ padding: '15px' }}>
          {myBets.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>እስካሁን ያደረጉት ውርርድ የለም።</p>
          ) : (
            myBets.map((bet) => (
              <div key={bet.id} style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', marginBottom: '12px', padding: '15px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>
                    {bet.football_matches?.home_team} vs {bet.football_matches?.away_team}
                  </span>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '5px', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    backgroundColor: bet.status === 'won' ? '#2e7d32' : bet.status === 'lost' ? '#c62828' : '#ef6c00',
                    color: '#fff'
                  }}>
                    {bet.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                  <span>ምርጫ: <b>{bet.prediction}</b> (Odds: {bet.odds})</span>
                  <span>መጠን: <b>{bet.amount} ETB</b></span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
