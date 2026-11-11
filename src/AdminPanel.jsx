import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function AdminPanel({ user }) {
  const [requests, setRequests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('wallet');

  // አዲስ ጨዋታ ለመጨመር የሚያስፈልጉ ስቴቶች (States)
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [league, setLeague] = useState('');
  const [oddsHome, setOddsHome] = useState(2.00);
  const [oddsDraw, setOddsDraw] = useState(3.20);
  const [oddsAway, setOddsAway] = useState(3.00);

  useEffect(() => {
    fetchRequests();
    fetchMatches();
  }, []);

  const fetchRequests = async () => {
    // በመጠባበቅ ላይ ያሉ የገንዘብ ጥያቄዎችን ማምጣት
    const { data } = await supabase.from('deposits_withdrawals').select('*').eq('status', 'pending');
    setRequests(data || []);
  };

  const fetchMatches = async () => {
    // የሚመጡ የእግር ኳስ ጨዋታዎችን ማምጣት
    const { data } = await supabase.from('football_matches').select('*').eq('status', 'upcoming');
    setMatches(data || []);
  };

  // ==========================================
  // 1. የገንዘብ ጥያቄዎችን ማስተዳደር (Approve/Reject)
  // ==========================================
  const handleTransaction = async (id, userId, amount, type, action) => {
    if (action === 'approve') {
      // ጥያቄውን አጽድቅ
      await supabase.from('deposits_withdrawals').update({ status: 'approved' }).eq('id', id);
      
      // ባላንስ አዘምን
      if (type === 'deposit') {
        await supabase.rpc('add_winning_balance', { p_user_id: userId, p_amount: amount, p_description: 'Deposit Approved' });
      } else {
        await supabase.rpc('deduct_balance', { p_user_id: userId, p_amount: amount });
      }
      alert("ጥያቄው ጸድቋል!");
    } else {
      // ውድቅ አድርግ
      await supabase.from('deposits_withdrawals').update({ status: 'rejected' }).eq('id', id);
      alert("ጥያቄው ውድቅ ተደርጓል።");
    }
    fetchRequests(); // ዝርዝሩን አድስ
  };

  // ==========================================
  // 2. አዲስ የእግር ኳስ ጨዋታ መጨመር
  // ==========================================
  const handleAddMatch = async (e) => {
    e.preventDefault();
    if (!homeTeam || !awayTeam || !league) {
      return alert("እባክህ ሁሉንም መስኮች ሙሉ!");
    }

    const { error } = await supabase.from('football_matches').insert([{
      home_team: homeTeam,
      away_team: awayTeam,
      league: league,
      odds_home: Number(oddsHome),
      odds_draw: Number(oddsDraw),
      odds_away: Number(oddsAway),
      status: 'upcoming'
    }]);

    if (error) {
      alert("ጨዋታውን መመዝገብ አልተቻለም።");
    } else {
      alert("✅ ጨዋታው በተሳካ ሁኔታ ተመዝግቧል!");
      setHomeTeam('');
      setAwayTeam('');
      setLeague('');
      fetchMatches();
    }
  };

  // ==========================================
  // 3. የጨዋታ ውጤት ማስገባት እና ገንዘብ መክፈል
  // ==========================================
  const handleMatchResult = async (matchId, result) => {
    if (!window.confirm("እርግጠኛ ነህ? ውጤቱን ስታስገባ ለአሸናፊዎች ገንዘብ በራስ-ሰር ይከፈላል።")) return;

    // 1. ጨዋታውን 'finished' አድርግ
    await supabase.from('football_matches').update({ status: 'finished', result: result }).eq('id', matchId);

    // 2. በዚህ ጨዋታ ላይ የተደረጉትን ውርርዶች አምጣ
    const { data: bets } = await supabase.from('football_bets').select('*').eq('match_id', matchId).eq('status', 'pending');

    if (bets && bets.length > 0) {
      for (const bet of bets) {
        if (bet.prediction === result) {
          // አሸናፊ ከሆነ: ገንዘቡን አስልተህ ጨምር
          const winAmount = bet.amount * bet.odds;
          await supabase.rpc('add_winning_balance', { 
            p_user_id: bet.user_id, 
            p_amount: winAmount, 
            p_description: `የእግር ኳስ ውርርድ ሽልማት (${bet.odds}x)` 
          });
          await supabase.from('football_bets').update({ status: 'won' }).eq('id', bet.id);
        } else {
          // ተሸናፊ ከሆነ: ውርርዱን ብቻ 'lost' አድርግ
          await supabase.from('football_bets').update({ status: 'lost' }).eq('id', bet.id);
        }
      }
    }
    alert("ውጤቱ ገብቷል፣ ለአሸናፊዎችም ገንዘብ ተከፍሏል!");
    fetchMatches();
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#e94560', textAlign: 'center' }}>👑 Admin Control Panel</h1>
      
      {/* የታብ መቀየሪያ ቁልፎች */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('wallet')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'wallet' ? '#e94560' : '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💰 የገንዘብ ጥያቄዎች</button>
        <button onClick={() => setActiveTab('add_match')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'add_match' ? '#e94560' : '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>⚽ ጨዋታ ጨምር</button>
        <button onClick={() => setActiveTab('results')} style={{ padding: '10px 20px', backgroundColor: activeTab === 'results' ? '#e94560' : '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>📊 ውጤት ማስገባት</button>
      </div>

      {/* የገንዘብ ጥያቄዎች ገጽ */}
      {activeTab === 'wallet' && (
        <div>
          <h3>የገንዘብ ጥያቄዎች (Pending Requests)</h3>
          {requests.length === 0 ? <p style={{ color: '#aaa' }}>ምንም ጥያቄ የለም።</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {requests.map(req => (
                <div key={req.id} style={{ backgroundColor: '#16213e', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>User ID: {req.user_id.substring(0, 8)}...</p>
                    <p style={{ margin: '5px 0 0 0', color: req.type === 'deposit' ? '#4CAF50' : '#f44336', fontWeight: 'bold', fontSize: '16px' }}>
                      {req.type.toUpperCase()}: {req.amount} ETB
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleTransaction(req.id, req.user_id, req.amount, req.type, 'approve')} style={{ padding: '8px 15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                    <button onClick={() => handleTransaction(req.id, req.user_id, req.amount, req.type, 'reject')} style={{ padding: '8px 15px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* አዲስ ጨዋታ የመጨመር ገጽ */}
      {activeTab === 'add_match' && (
        <div style={{ backgroundColor: '#16213e', padding: '20px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto', border: '1px solid #333' }}>
          <h3 style={{ marginTop: 0, color: '#e94560' }}>አዲስ የእግር ኳስ ጨዋታ መዝግብ</h3>
          <form onSubmit={handleAddMatch}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>ሊግ (League)</label>
              <input type="text" value={league} onChange={e => setLeague(e.target.value)} placeholder="ለምሳሌ: English Premier League" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>አስተናጋጅ ቡድን (Home Team)</label>
                <input type="text" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} placeholder="Arsenal" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>ተጋጣሚ ቡድን (Away Team)</label>
                <input type="text" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} placeholder="Chelsea" style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Odds (Home - W1)</label>
                <input type="number" step="0.01" value={oddsHome} onChange={e => setOddsHome(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Odds (Draw - X)</label>
                <input type="number" step="0.01" value={oddsDraw} onChange={e => setOddsDraw(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Odds (Away - W2)</label>
                <input type="number" step="0.01" value={oddsAway} onChange={e => setOddsAway(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>ጨዋታ አስገባ</button>
          </form>
        </div>
      )}

      {/* የጨዋታ ውጤቶች ገጽ */}
      {activeTab === 'results' && (
        <div>
          <h3>የጨዋታ ውጤቶችን አስገባ</h3>
          {matches.length === 0 ? <p style={{ color: '#aaa' }}>ምንም የሚጠበቅ ጨዋታ የለም።</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {matches.map(match => (
                <div key={match.id} style={{ backgroundColor: '#16213e', padding: '15px', borderRadius: '10px', border: '1px solid #333' }}>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#aaa' }}>🏆 {match.league}</p>
                  <h4 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '18px' }}>{match.home_team} vs {match.away_team}</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleMatchResult(match.id, 'home_win')} style={{ flex: 1, padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{match.home_team} አሸነፈ</button>
                    <button onClick={() => handleMatchResult(match.id, 'draw')} style={{ flex: 1, padding: '10px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>አቻ ሆነ (Draw)</button>
                    <button onClick={() => handleMatchResult(match.id, 'away_win')} style={{ flex: 1, padding: '10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{match.away_team} አሸነፈ</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
