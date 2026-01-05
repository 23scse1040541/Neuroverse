import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '../utils/api.js'
import { useAuth } from '../state/AuthContext.jsx'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useTheme } from '../state/ThemeContext.jsx'
import { Link } from 'react-router-dom'
import { Flame, Star, BookOpen, Wind, Gamepad2 } from 'lucide-react'

export default function Dashboard() {
  const { token } = useAuth()
  const api = useMemo(()=>createClient(()=>token),[token])
  const [trend, setTrend] = useState([])
  const [summary, setSummary] = useState('')
  const [avgStress, setAvgStress] = useState(0)
  const [moodScore, setMoodScore] = useState(0)
  const { setTheme } = useTheme()
  const [profile, setProfile] = useState({ xp: 0, streakCount: 0 })
  const [topEmotion, setTopEmotion] = useState('Neutral')

  useEffect(()=>{
    (async()=>{
      try {
        const { data } = await api.get('/insights/weekly')
        setTrend(data.trend.map(d=>({ ...d, date: new Date(d.date).toLocaleDateString() })))
        setSummary(data.summary)
        setAvgStress(data.avgStress)
        setMoodScore(data.moodScore)
        const top = (data.topEmotion||'').toLowerCase()
        setTopEmotion(data.topEmotion || 'Neutral')
        if (top.includes('happy')) setTheme('happy')
        else if (top.includes('sad')) setTheme('sad')
        else if (top.includes('anx')) setTheme('anxious')
        else if (top.includes('ang')) setTheme('focus')
        else setTheme('default')
      } catch {}
      try {
        const { data } = await api.get('/user/me')
        setProfile({ xp: data.xp || 0, streakCount: data.streakCount || 0 })
      } catch {}
    })()
  },[api])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <motion.div className="card md:col-span-2" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
        <h2 className="text-lg font-semibold mb-2">Emotion Trend</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
              <XAxis dataKey="date" stroke="#ddd" />
              <YAxis stroke="#ddd" />
              <Tooltip contentStyle={{ background:'rgba(0,0,0,0.6)', border:'none', color:'#fff' }} />
              <Line type="monotone" dataKey="stress" stroke="#f87171" strokeWidth={2} dot={false} name="Stress" />
              <Line type="monotone" dataKey="mood" stroke="#34d399" strokeWidth={2} dot={false} name="Mood" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
        <h2 className="text-lg font-semibold mb-2">AI Insights</h2>
        <p className="text-white/80 text-sm">{summary || 'Add journal entries to see insights.'}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="card"><div className="text-sm text-white/70">Avg Stress</div><div className="text-2xl font-bold">{avgStress}</div></div>
          <div className="card"><div className="text-sm text-white/70">Mood Score</div><div className="text-2xl font-bold">{moodScore}</div></div>
        </div>
      </motion.div>
      <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-indigo-500 text-xl">
            {topEmotion && topEmotion.toLowerCase().includes('happy') ? '😊' : topEmotion.toLowerCase().includes('sad') ? '😔' : topEmotion.toLowerCase().includes('anx') ? '😟' : topEmotion.toLowerCase().includes('ang') ? '😠' : '🙂'}
          </div>
          <div>
            <div className="text-sm text-white/70">Mood</div>
            <div className="text-lg font-semibold">{topEmotion || 'Neutral'}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="card flex items-center gap-2"><Star size={18} className="text-yellow-300" /><div>
            <div className="text-xs text-white/70">XP</div>
            <div className="text-xl font-bold">{profile.xp}</div>
          </div></div>
          <div className="card flex items-center gap-2"><Flame size={18} className="text-orange-400" /><div>
            <div className="text-xs text-white/70">Streak</div>
            <div className="text-xl font-bold">{profile.streakCount}d</div>
          </div></div>
        </div>
        <LevelRing xp={profile.xp||0} />
      </motion.div>
      <motion.div className="card md:col-span-2" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/journal" className="btn flex items-center justify-center gap-2"><BookOpen size={18} /> Journal</Link>
          <Link to="/relax" className="btn flex items-center justify-center gap-2"><Wind size={18} /> Breathe</Link>
          <Link to="/games" className="btn flex items-center justify-center gap-2"><Gamepad2 size={18} /> Games</Link>
        </div>
      </motion.div>
    </div>
  )
}

function LevelRing({ xp }){
  const level = Math.floor((xp||0)/100) + 1
  const pct = (xp||0) % 100
  const r = 28
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct/100)
  return (
    <div className="mt-4 flex items-center gap-3">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="8" fill="none" />
        <circle cx="36" cy="36" r={r} stroke="#34d399" strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)"/>
        <text x="36" y="41" textAnchor="middle" fontSize="14" fill="#fff">{pct}%</text>
      </svg>
      <div>
        <div className="text-sm text-white/70">Level</div>
        <div className="text-lg font-semibold">{level}</div>
        <div className="text-xs text-white/60">{100-pct} XP to next</div>
      </div>
    </div>
  )
}
