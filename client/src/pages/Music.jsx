import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'
import { Heart, Play, Pause, Plus, Trash2, Music2, Volume2 } from 'lucide-react'

const basePlaylists = {
  Calm: [
    { name: 'Calm Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: 'Gentle Breeze', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  ],
  Focus: [
    { name: 'Deep Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'Flow State', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ],
  Sleep: [
    { name: 'Dreamscape', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  ],
  Motivation: [
    { name: 'Rise Up', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  ],
}

export default function Music() {
  const { token } = useAuth()
  const api = useMemo(()=>createClient(()=>token),[token])
  const [tab, setTab] = useState('Calm')
  const [current, setCurrent] = useState(null)
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const toneGainRef = useRef(null)
  const [toneLevel, setToneLevel] = useState(0)
  const [favorites, setFavorites] = useState(()=>loadFavs())
  const [custom, setCustom] = useState(()=>loadCustom())
  const [newListName, setNewListName] = useState('')
  const playlists = useMemo(()=>({ ...basePlaylists, Favorites: favorites, ...custom }),[favorites, custom])

  useEffect(()=>{
    (async()=>{
      try {
        const { data } = await api.get('/insights/weekly')
        const top = (data.topEmotion||'').toLowerCase()
        if (top.includes('happy')) setTab('Motivation')
        else if (top.includes('sad')) setTab('Calm')
        else if (top.includes('anx')) setTab('Calm')
        else if (top.includes('ang')) setTab('Focus')
        else setTab('Calm')
      } catch { setTab('Calm') }
    })()
  },[api])

  const play = (track) => {
    setCurrent(track)
    if (audioRef.current) {
      audioRef.current.src = track.url
      audioRef.current.play()
    }
    ensureAudio()
    connectVisualizer()
  }

  const toggle = () => {
    if (!audioRef.current) return
    if (audioRef.current.paused) audioRef.current.play(); else audioRef.current.pause()
  }

  const like = (track) => {
    if (!track) return
    const exists = favorites.find(t=>t.url===track.url)
    if (exists) return
    const next = [...favorites, track]
    setFavorites(next)
    localStorage.setItem('music_favs', JSON.stringify(next))
  }

  const createList = () => {
    const name = newListName.trim()
    if (!name) return
    if (custom[name]) return
    const next = { ...custom, [name]: [] }
    setCustom(next)
    localStorage.setItem('music_custom', JSON.stringify(next))
    setNewListName('')
  }

  const addToList = (name, track) => {
    if (!track) return
    const arr = custom[name] || []
    if (arr.find(t=>t.url===track.url)) return
    const next = { ...custom, [name]: [...arr, track] }
    setCustom(next)
    localStorage.setItem('music_custom', JSON.stringify(next))
  }

  const removeFromList = (name, url) => {
    if (name==='Favorites') {
      const nextFav = favorites.filter(t=>t.url!==url)
      setFavorites(nextFav)
      localStorage.setItem('music_favs', JSON.stringify(nextFav))
      return
    }
    const arr = (custom[name]||[]).filter(t=>t.url!==url)
    const next = { ...custom, [name]: arr }
    setCustom(next)
    localStorage.setItem('music_custom', JSON.stringify(next))
  }

  function ensureAudio(){
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      // ambient tone
      const osc = ctx.createOscillator(); osc.type='sine'; osc.frequency.value = 432
      const g = ctx.createGain(); g.gain.value = 0
      osc.connect(g); g.connect(ctx.destination); osc.start()
      toneGainRef.current = g
    }
  }

  function connectVisualizer(){
    if (!audioRef.current) return
    const ctx = audioCtxRef.current || new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    const src = ctx.createMediaElementSource(audioRef.current)
    const analyser = ctx.createAnalyser(); analyser.fftSize = 256
    const gain = ctx.createGain(); gain.gain.value = 0.9
    src.connect(gain); gain.connect(analyser); analyser.connect(ctx.destination)
    analyserRef.current = analyser
    draw()
  }

  function draw(){
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return
    const ctx2d = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const render = () => {
      requestAnimationFrame(render)
      analyser.getByteFrequencyData(dataArray)
      ctx2d.clearRect(0,0,canvas.width, canvas.height)
      const barWidth = (canvas.width / bufferLength) * 1.5
      let x=0
      for (let i=0;i<bufferLength;i++){
        const v = dataArray[i]
        const h = (v/255) * canvas.height
        ctx2d.fillStyle = 'rgba(52, 211, 153, 0.8)'
        ctx2d.fillRect(x, canvas.height - h, barWidth, h)
        x += barWidth + 1
      }
    }
    render()
  }

  const setTone = (v) => {
    ensureAudio()
    setToneLevel(v)
    if (toneGainRef.current) toneGainRef.current.gain.value = v
  }

  return (
    <div className="card">
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(playlists).map(k=> (
          <button key={k} onClick={()=>setTab(k)} className={`btn ${tab===k?'btn-primary':'btn-secondary'}`}>{k}</button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <h3 className="font-semibold mb-2">Tracks</h3>
          {(playlists[tab]||[]).map((t,i)=> (
            <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg mb-2">
              <div className="truncate">{t.name}</div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={()=>play(t)}><Play size={16}/></button>
                <button className="btn-secondary" title="Favorite" onClick={()=>like(t)}><Heart size={16}/></button>
                {tab!=='Favorites' && custom[tab] && <button className="btn-secondary" title="Add to this list" onClick={()=>addToList(tab, t)}><Plus size={16}/></button>}
                {(tab==='Favorites' || custom[tab]) && <button className="btn-secondary" title="Remove" onClick={()=>removeFromList(tab, t.url)}><Trash2 size={16}/></button>}
              </div>
            </div>
          ))}
          <div className="mt-3 flex gap-2 items-center">
            <input className="input" placeholder="New playlist name" value={newListName} onChange={e=>setNewListName(e.target.value)} />
            <button className="btn-secondary" onClick={createList}><Plus size={16} className="mr-1"/>Create</button>
            {current && custom[tab] && <button className="btn-secondary" onClick={()=>addToList(tab, current)}><Plus size={16} className="mr-1"/>Add current</button>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Now Playing</h3>
          <div className="p-3 bg-white/5 rounded-lg min-h-[160px]">
            {current ? <>
              <div className="mb-2 flex items-center justify-between">
                <div className="truncate">{current.name}</div>
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={toggle}><Play size={16} className="mr-1"/>Play/Pause</button>
                  <button className="btn-secondary" title="Favorite" onClick={()=>like(current)}><Heart size={16}/></button>
                </div>
              </div>
              <canvas ref={canvasRef} width="400" height="80" className="w-full h-20 bg-black/30 rounded mb-2" />
              <audio ref={audioRef} controls className="w-full mt-1" />
              <div className="mt-3 flex items-center gap-2 text-sm text-white/80"><Music2 size={16}/> Ambient tone
                <Volume2 size={14} className="text-white/60"/>
                <input type="range" min="0" max="0.2" step="0.005" value={toneLevel} onChange={e=>setTone(parseFloat(e.target.value))} className="w-full accent-emerald-400" />
              </div>
            </> : 'Select a track to play'}
          </div>
        </div>
      </div>
    </div>
  )
}

function loadFavs(){
  try { return JSON.parse(localStorage.getItem('music_favs')||'[]') } catch { return [] }
}
function loadCustom(){
  try { return JSON.parse(localStorage.getItem('music_custom')||'{}') } catch { return {} }
}
