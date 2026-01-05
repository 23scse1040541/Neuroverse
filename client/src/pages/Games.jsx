import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Grid, Timer } from 'lucide-react'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'

export default function Games(){
  const { token } = useAuth()
  const api = React.useMemo(()=>createClient(()=>token),[token])
  const [xpMsg, setXpMsg] = useState('')
  const [recent, setRecent] = useState(()=>loadFeed())

  const awardXP = async (delta, reason) => {
    try {
      await api.post('/user/xp', { delta, reason })
      setXpMsg(`+${delta} XP · ${reason}`)
    } catch {
      const cur = parseInt(localStorage.getItem('xp_local')||'0',10)
      const next = cur + delta
      localStorage.setItem('xp_local', String(next))
      setXpMsg(`+${delta} XP (local) · ${reason}`)
    }
    const evt = { delta, reason, at: Date.now() }
    setRecent(prev => {
      const arr = [evt, ...prev].slice(0,6)
      localStorage.setItem('xp_feed', JSON.stringify(arr))
      return arr
    })
    setTimeout(()=>setXpMsg(''), 2000)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Reaction Timer</h2>
        <ReactionTimer onXP={awardXP} />
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Color Match</h2>
        <ColorMatch onXP={awardXP} />
      </div>
      <div className="card md:col-span-1">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Brain size={18}/> Memory Bloom</h2>
        <MemoryBloom onXP={awardXP} />
      </div>
      <div className="card md:col-span-1">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Grid size={18}/> Focus Tiles</h2>
        <FocusTiles onXP={awardXP} />
      </div>
      {!!xpMsg && <div className="md:col-span-2 text-emerald-300 text-sm">{xpMsg}</div>}
      <div className="card md:col-span-2">
        <h2 className="text-lg font-semibold mb-2">Recent XP</h2>
        {recent.length ? (
          <div className="space-y-2">
            {recent.map((e,i)=> (
              <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div className="text-sm text-white/80">{e.reason}</div>
                <div className="text-emerald-300 text-sm font-semibold">+{e.delta} XP</div>
                <div className="text-xs text-white/50">{new Date(e.at).toLocaleTimeString()}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-sm">Play any game to earn XP.</div>
        )}
      </div>
    </div>
  )
}

function ReactionTimer({ onXP }){
  const [state, setState] = useState('idle') // idle | wait | go | result
  const [message, setMessage] = useState('Click start and wait for green')
  const [start, setStart] = useState(0)
  const [score, setScore] = useState(null)
  const timeoutRef = useRef(null)

  const startGame = () => {
    clearTimeout(timeoutRef.current)
    setScore(null)
    setState('wait')
    setMessage('Wait for green...')
    timeoutRef.current = setTimeout(()=>{
      setState('go')
      setMessage('Click now!')
      setStart(performance.now())
    }, 800 + Math.random()*2000)
  }

  const click = () => {
    if (state === 'wait') {
      setState('result')
      setMessage('Too early! Try again.')
    } else if (state === 'go') {
      const t = Math.round(performance.now() - start)
      setScore(t)
      setState('result')
      setMessage(`Reaction: ${t} ms`)
      // XP: faster -> more XP
      if (onXP){
        const xp = t < 250 ? 15 : t < 350 ? 10 : 5
        onXP(xp, 'Reaction win')
      }
    }
  }

  useEffect(()=>()=>clearTimeout(timeoutRef.current),[])

  return (
    <div>
      <div className="h-40 rounded-lg flex items-center justify-center text-xl font-semibold select-none"
           onClick={click}
           style={{ background: state==='go'?'#22c55e33': state==='wait'?'#f59e0b33':'#ffffff1a', border:'1px solid rgba(255,255,255,0.15)' }}>
        {message}
      </div>
      <div className="mt-3 flex gap-2 items-center">
        <button className="btn-primary" onClick={startGame}>Start</button>
        {score!=null && <div className="text-white/80 text-sm">Best practice: 200–300 ms</div>}
      </div>
    </div>
  )
}

function ColorMatch({ onXP }){
  const colors = ['red','green','blue','yellow']
  const [target, setTarget] = useState(colors[0])
  const [choices, setChoices] = useState(shuffle([...colors]))
  const [msg, setMsg] = useState('Pick the color name that matches the word (not its color).')

  useEffect(()=>{ newRound() },[])

  function newRound(){
    const t = colors[Math.floor(Math.random()*colors.length)]
    setTarget(t)
    setChoices(shuffle([...colors]))
    setMsg('')
  }

  function choose(c){
    if (c===target) setMsg('Great!'); else setMsg('Oops, try again!')
    if (c===target && onXP) onXP(5, 'Color match')
    setTimeout(newRound, 700)
  }

  return (
    <div>
      <div className="p-4 rounded-lg border border-white/10 bg-white/5 text-center">
        <div className="text-sm text-white/70 mb-2">Choose the correct color name</div>
        <div className="text-2xl font-bold mb-3" style={{ color: randomDistractorColor(target) }}>{target.toUpperCase()}</div>
        <div className="grid grid-cols-2 gap-2">
          {choices.map(c => (
            <button key={c} className="btn-secondary" onClick={()=>choose(c)}>{c.toUpperCase()}</button>
          ))}
        </div>
        {msg && <div className="mt-3 text-white/80 text-sm">{msg}</div>}
      </div>
    </div>
  )
}

function shuffle(arr){
  for (let i=arr.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] }
  return arr
}

function randomDistractorColor(target){
  const map = { red:'#ef4444', green:'#22c55e', blue:'#3b82f6', yellow:'#eab308' }
  const keys = Object.keys(map).filter(k=>k!==target)
  return map[keys[Math.floor(Math.random()*keys.length)]]
}

function MemoryBloom({ onXP }){
  const [level, setLevel] = useState(1)
  const [cards, setCards] = useState([])
  const [flipped, setFlipped] = useState([]) // indices
  const [matched, setMatched] = useState({})
  const [moves, setMoves] = useState(0)
  const [startAt, setStartAt] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  useEffect(()=>{ newGame(level) },[level])
  useEffect(()=>{
    if (startAt){ timerRef.current = setInterval(()=> setElapsed(Math.floor((Date.now()-startAt)/1000)), 500) }
    return ()=>clearInterval(timerRef.current)
  },[startAt])

  function newGame(lvl){
    const pairs = Math.min(8, 3 + lvl) // 4..8 pairs
    const symbols = '🍃🌸🌙⭐️💧🔥🍀🌈🌊🪴🎵'.split('').slice(0, pairs)
    const deck = shuffle([...symbols, ...symbols]).map((s, i)=>({ id:i, s }))
    setCards(deck); setFlipped([]); setMatched({}); setMoves(0); setElapsed(0); setStartAt(Date.now())
  }

  function flip(i){
    if (matched[i] || flipped.includes(i) || flipped.length===2) return
    const next = [...flipped, i]
    setFlipped(next)
    if (next.length===2){
      setMoves(m=>m+1)
      const [a,b] = next
      if (cards[a].s === cards[b].s){
        setMatched(m=>({ ...m, [a]:true, [b]:true }))
        setFlipped([])
        setTimeout(()=>{
          if (Object.keys(matched).length + 2 === cards.length){
            if (onXP) onXP(15, 'Memory Bloom level up')
            setLevel(l=>l+1)
          }
        }, 300)
      } else {
        setTimeout(()=> setFlipped([]), 800)
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm text-white/70">
        <div>Level {level}</div>
        <div className="flex items-center gap-1"><Timer size={14}/> {elapsed}s • Moves {moves}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cards.map((c,i)=>{
          const isUp = flipped.includes(i) || matched[i]
          return (
            <button key={c.id} onClick={()=>flip(i)} className={`h-16 rounded-lg flex items-center justify-center text-2xl transition-colors ${isUp?'bg-white/20':'bg-white/5'}`}>
              {isUp? c.s : '❖'}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn-secondary" onClick={()=>newGame(level)}>Restart</button>
        {Object.keys(matched).length===cards.length && <div className="text-emerald-300 text-sm">Great job! Leveling up…</div>}
      </div>
    </div>
  )
}

function FocusTiles({ onXP }){
  const tiles = [0,1,2,3]
  const [seq, setSeq] = useState([])
  const [user, setUser] = useState([])
  const [active, setActive] = useState(-1)
  const [running, setRunning] = useState(false)
  const [level, setLevel] = useState(1)
  const speed = Math.max(250, 700 - level*50) // adaptive speed

  useEffect(()=>{ reset() },[])

  function reset(){
    setSeq([randTile()]); setUser([]); setRunning(false); setLevel(1)
  }
  function randTile(){ return Math.floor(Math.random()*4) }

  function playSeq(){
    setRunning(true)
    let i=0
    const interval = setInterval(()=>{
      setActive(seq[i])
      setTimeout(()=> setActive(-1), speed/2)
      i++
      if (i>=seq.length){ clearInterval(interval); setRunning(false) }
    }, speed)
  }

  function press(t){
    if (running) return
    const next = [...user, t]
    setUser(next)
    const idx = next.length-1
    if (next[idx] !== seq[idx]){
      setSeq([randTile()]); setUser([]); setLevel(1)
      return
    }
    if (next.length === seq.length){
      const extended = [...seq, randTile()]
      setSeq(extended); setUser([]); setLevel(l=>l+1)
      if (onXP) onXP(10, 'Focus Tiles level up')
      setTimeout(playSeq, 500)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm text-white/70"><div>Level {level}</div><button className="btn-secondary" onClick={playSeq} disabled={running}>Play Sequence</button></div>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(t=> (
          <button key={t} onClick={()=>press(t)} className={`h-20 rounded-lg ${active===t?'bg-emerald-400/70':'bg-white/10'}`}></button>
        ))}
      </div>
      <div className="mt-2 text-xs text-white/70">Watch the sequence, then repeat it. Speed increases as you level up.</div>
    </div>
  )
}

function loadFeed(){
  try { return JSON.parse(localStorage.getItem('xp_feed')||'[]') } catch { return [] }
}
