import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'
import { Wind, Droplets, Waves, Music2, Trophy, Play, Pause, Volume2 } from 'lucide-react'

export default function Relax() {
  const { token } = useAuth()
  const api = useMemo(()=>createClient(()=>token),[token])
  const [quote, setQuote] = useState('')

  // Adaptive breathing based on avgStress
  const [avgStress, setAvgStress] = useState(50)
  const [phase, setPhase] = useState('Inhale')
  const [running, setRunning] = useState(false)
  const [breathCount, setBreathCount] = useState(0)
  const timerRef = useRef(null)

  // Calm Streak
  const [streak, setStreak] = useState(0)
  const [badge, setBadge] = useState('')

  // Ambient mixer (WebAudio)
  const audioCtxRef = useRef(null)
  const [mixer, setMixer] = useState({ rain: 0, ocean: 0, wind: 0, tone: 0 })
  const nodesRef = useRef({})

  useEffect(()=>{
    fetch('https://type.fit/api/quotes').then(r=>r.json()).then(arr=>{
      const q = arr[Math.floor(Math.random()*arr.length)]
      setQuote(`${q.text} — ${q.author||'Unknown'}`)
    }).catch(()=>setQuote('Breathe. You are here.'))
  },[])

  useEffect(()=>{
    (async()=>{
      try { const { data } = await api.get('/insights/weekly'); setAvgStress(data.avgStress || 50) } catch {}
      // load calm streak
      const last = localStorage.getItem('calm_last')
      const streakVal = parseInt(localStorage.getItem('calm_streak')||'0',10)
      if (last) {
        const lastDate = new Date(last)
        const today = new Date()
        const diff = daysBetween(lastDate, today)
        if (diff === 1) setStreak(streakVal)
        else if (diff === 0) setStreak(streakVal)
        else setStreak(0)
      } else {
        setStreak(0)
      }
      updateBadge(streakVal)
    })()
  },[api])

  useEffect(()=>{ updateBadge(streak) },[streak])

  const pattern = useMemo(()=>{
    // Map avgStress to a breathing pattern [inhale, hold, exhale] seconds x animation duration
    // High stress => longer exhale and slower pace
    if (avgStress >= 70) return { label: '4-4-8 Calm', seq: [4,4,8], anim: 16 }
    if (avgStress >= 50) return { label: '4-7-8 Relax', seq: [4,7,8], anim: 19 }
    return { label: 'Box 4-4-4', seq: [4,4,4], anim: 12 }
  },[avgStress])

  const start = () => {
    if (running) return
    setRunning(true)
    setBreathCount(0)
    runCycle()
  }
  const stop = () => {
    setRunning(false)
    clearTimeout(timerRef.current)
  }

  const runCycle = () => {
    const [inhale, hold, exhale] = pattern.seq
    setPhase('Inhale')
    timerRef.current = setTimeout(()=>{
      setPhase('Hold')
      timerRef.current = setTimeout(()=>{
        setPhase('Exhale')
        timerRef.current = setTimeout(()=>{
          setBreathCount(c=>{
            const n = c+1
            if (!running) return n
            if (n >= 6) { // session completed after 6 breaths
              completeSession()
              setRunning(false)
              return n
            }
            runCycle()
            return n
          })
        }, exhale*1000)
      }, hold*1000)
    }, inhale*1000)
  }

  const completeSession = () => {
    // update calm streak
    const todayStr = new Date().toDateString()
    const last = localStorage.getItem('calm_last')
    const lastStr = last ? new Date(last).toDateString() : ''
    let s = parseInt(localStorage.getItem('calm_streak')||'0',10)
    if (lastStr === todayStr) {
      // already counted
    } else {
      if (!last) s = 1
      else {
        const diff = daysBetween(new Date(last), new Date())
        s = diff === 1 ? s+1 : 1
      }
      localStorage.setItem('calm_streak', String(s))
      localStorage.setItem('calm_last', new Date().toISOString())
      setStreak(s)
    }
  }

  const updateBadge = (s) => {
    if (s >= 14) setBadge('Serene Sage')
    else if (s >= 7) setBadge('Calm Voyager')
    else if (s >= 3) setBadge('Breath Beginner')
    else setBadge('')
  }

  // ------- Ambient Mixer (WebAudio noise-based) -------
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      nodesRef.current = createMixerNodes(ctx)
    }
  }

  const setLevel = (key, value) => {
    ensureAudio()
    setMixer(m => ({ ...m, [key]: value }))
    const n = nodesRef.current
    if (n[key]) n[key].gain.gain.value = value
  }

  const createMixerNodes = (ctx) => {
    const master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination)

    const makeNoise = (type) => {
      const bufferSize = 2 * ctx.sampleRate
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i=0; i<bufferSize; i++) output[i] = Math.random()*2-1
      const white = ctx.createBufferSource(); white.buffer = noiseBuffer; white.loop = true
      const filter = ctx.createBiquadFilter()
      if (type==='ocean') { filter.type='lowpass'; filter.frequency.value = 500 }
      if (type==='wind') { filter.type='bandpass'; filter.frequency.value = 1000; filter.Q.value=0.5 }
      if (type==='rain') { filter.type='highpass'; filter.frequency.value = 1500 }
      white.connect(filter)
      const g = ctx.createGain(); g.gain.value = 0
      filter.connect(g); g.connect(master)
      white.start()
      return { source:white, filter, gain:g }
    }

    const makeTone = () => {
      const osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value = 432
      const g = ctx.createGain(); g.gain.value = 0
      osc.connect(g); g.connect(master)
      osc.start()
      return { osc, gain:g }
    }

    return {
      rain: makeNoise('rain'),
      ocean: makeNoise('ocean'),
      wind: makeNoise('wind'),
      tone: makeTone(),
      gain: master
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card flex flex-col items-center justify-center h-96">
        <motion.div
          className="w-44 h-44 rounded-full bg-white/20"
          animate={{ scale: phase==='Inhale' ? [1,1.2] : phase==='Hold' ? [1.2,1.2] : [1.2,1] }}
          transition={{ duration: phase==='Hold' ? (pattern.seq[1]) : (phase==='Inhale' ? pattern.seq[0] : pattern.seq[2]), ease: 'easeInOut' }}
        />
        <div className="mt-3 text-white/80">{pattern.label}</div>
        <div className="mt-1 text-white/60 text-sm">Phase: {phase} • Breaths: {breathCount}</div>
        <div className="mt-3 flex gap-2">
          {!running ? (
            <button className="btn-primary flex items-center gap-1" onClick={start}><Play size={16}/> Start</button>
          ) : (
            <button className="btn-secondary flex items-center gap-1" onClick={stop}><Pause size={16}/> Stop</button>
          )}
        </div>
        <div className="mt-3 p-2 rounded bg-white/5 text-center text-sm">
          <div className="text-white/70">Calm Streak</div>
          <div className="text-2xl font-bold flex items-center justify-center gap-2"><Trophy size={18} className="text-yellow-300"/>{streak} days</div>
          {!!badge && <div className="mt-1 text-emerald-300 text-xs">Badge: {badge}</div>}
          <div className="mt-1 text-white/60 text-xs">Complete a 6-breath session daily to keep your streak.</div>
        </div>
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Ambient Mixer</h2>
        <div className="space-y-3">
          <MixerRow icon={<Droplets size={16}/>} label="Rain" value={mixer.rain} onChange={v=>setLevel('rain', v)} />
          <MixerRow icon={<Waves size={16}/>} label="Ocean" value={mixer.ocean} onChange={v=>setLevel('ocean', v)} />
          <MixerRow icon={<Wind size={16}/>} label="Wind" value={mixer.wind} onChange={v=>setLevel('wind', v)} />
          <MixerRow icon={<Music2 size={16}/>} label="Soft Tone" value={mixer.tone} onChange={v=>setLevel('tone', v)} />
          <div className="text-xs text-white/60">Tip: Blend rain with soft tone for a soothing background.</div>
        </div>
        <h2 className="text-lg font-semibold mt-6 mb-2">Motivational Quote</h2>
        <p className="text-white/80">{quote || 'Loading...'}</p>
      </div>
    </div>
  )
}

function MixerRow({ icon, label, value, onChange }){
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex items-center gap-2 text-sm text-white/80">{icon}<span>{label}</span></div>
      <Volume2 size={16} className="text-white/60"/>
      <input type="range" min="0" max="1" step="0.01" value={value}
        onChange={e=>onChange(parseFloat(e.target.value))}
        className="w-full accent-emerald-400" />
    </div>
  )
}

function daysBetween(a, b){
  const d1 = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const d2 = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((d2 - d1)/(1000*60*60*24))
}
