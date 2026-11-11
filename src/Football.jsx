import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function Football({ user }) {
  const [matches, setMatches] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState({});
  const [betAmount, setBetAmount] = useState(50);

  useEffect(() => {
    fetchMatches();
    fetchBalance();
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

  const handleSelectBet = (matchId, prediction, odds) => {
    setSelectedBets({ ...selectedBets, [matchId]: { prediction, odds } });
  };

  const placeBet = async (match) => {
    const bet = selectedBets[match.id];
    if (!bet) return alert("እባክህ መጀመሪያ ውጤት ምረጥ!");
    if (betAmount > balance) return alert("❌ ባላንስህ አይበቃም! እባክህ ገንዘብ አስገባ።");
    if (betAmount <= 0) return alert("ትክክለኛ መጠን አስገባ!");

    setLoading(true);

    // 1. ገንዘቡን ከባላንስ መቀነስ (በደህንነት)
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
    }
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '50px', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0, color: '#333' }}>⚽ Sports</h2>
        <div style={{ backgroundColor: '#ffc107', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>
          ባላንስ፦ {balance.toFixed(2)} ETB
        </div>
      </div>

      <div style={{ padding: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#333' }}>የውርርድ መጠን፦ </label>
        <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', marginLeft: '10px', width: '80px' }} />
      </div>

      {loading ? <p style={{ textAlign: 'center' }}>በመጫን ላይ...</p> : matches.length === 0 ? <p style={{ textAlign: 'center', padding: '20px' }}>አሁን ምንም የሚጫወቱ ጨዋታዎች የሉም።</p> : (
        <div style={{ padding: '0 15px' }}>
          {matches.map((match) => (
            <div key={match.id} style={{ backgroundColor: '#fff', borderRadius: '10px', marginBottom: '15px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#777', marginBottom: '10px' }}>
                <span>🏆 {match.league}</span>
                <span>🕒 ዛሬ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontWeight: 'bold', color: '#222', fontSize: '16px' }}>
                <span>{match.home_team}</span>
                <span style={{ color: '#999' }}>VS</span>
                <span>{match.away_team}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleSelectBet(match.id, 'home_win', match.odds_home)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedBets[match.id]?.prediction === 'home_win' ? '#ffc107' : '#f0f0f0', color: selectedBets[match.id]?.prediction === 'home_win' ? '#000' : '#333' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: '#666' }}>W1</span>
                  {match.odds_home.toFixed(2)}
                </button>
                <button onClick={() => handleSelectBet(match.id, 'draw', match.odds_draw)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedBets[match.id]?.prediction === 'draw' ? '#ffc107' : '#f0f0f0', color: selectedBets[match.id]?.prediction === 'draw' ? '#000' : '#333' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: '#666' }}>X</span>
                  {match.odds_draw.toFixed(2)}
                </button>
                <button onClick={() => handleSelectBet(match.id, 'away_win', match.odds_away)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: selectedBets[match.id]?.prediction === 'away_win' ? '#ffc107' : '#f0f0f0', color: selectedBets[match.id]?.prediction === 'away_win' ? '#000' : '#333' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: '#666' }}>W2</span>
                  {match.odds_away.toFixed(2)}
                </button>
              </div>
              {selectedBets[match.id] && (
                <button onClick={() => placeBet(match)} style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: '#4CAF50', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
                  ውረድ (Bet {betAmount} ETB)
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
