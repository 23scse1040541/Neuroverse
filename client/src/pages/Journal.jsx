import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'
import { Trash2, Edit3, Save, X, Mic, Paperclip, Search, Sparkles, Shuffle } from 'lucide-react'

export default function Journal() {
  const { token } = useAuth()
  const api = useMemo(()=>createClient(()=>token),[token])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [entries, setEntries] = useState([])
  const [tags, setTags] = useState('')
  const [files, setFiles] = useState([]) // {type, data}
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingTags, setEditingTags] = useState('')
  const [searchTag, setSearchTag] = useState('')
  const [searchEmotion, setSearchEmotion] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const prompts = [
    'What energized you today and why?',
    'Name one worry on your mind and one action you can take.',
    'Describe a moment you felt calm today.',
    'What are three small things you appreciate right now?',
    'How did your body feel today? Any tension or ease?',
    'What would kindness to yourself look like tonight?'
  ]

  const loadEntries = async () => {
    setListLoading(true)
    try { const { data } = await api.get('/journal'); setEntries(data) } catch {}
    setListLoading(false)
  }

  const insertPrompt = (p) => {
    setText(prev => {
      if (!prev.trim()) return p
      const sep = prev.trim().endsWith('.') ? ' ' : ' '
      return prev + sep + p
    })
  }

  useEffect(()=>{ loadEntries() },[])

  const analyze = async () => {
    setLoading(true)
    try {
      const tagArr = tags.split(',').map(s=>s.trim()).filter(Boolean)
      const { data } = await api.post('/journal', { text, tags: tagArr, attachments: files })
      setResult(data)
      setText('')
      setTags('')
      setFiles([])
      await loadEntries()
    } catch {}
    setLoading(false)
  }

  const del = async (id) => {
    try { await api.delete(`/journal/${id}`); setEntries(e => e.filter(x=>x.id!==id)) } catch {}
  }

  const startEdit = (e) => {
    setEditingId(e.id)
    setEditingText(e.content)
    setEditingTags((e.tags||[]).join(', '))
  }
  const cancelEdit = () => { setEditingId(null); setEditingText(''); setEditingTags('') }
  const saveEdit = async (id) => {
    try {
      const tagArr = editingTags.split(',').map(s=>s.trim()).filter(Boolean)
      await api.put(`/journal/${id}`, { text: editingText, tags: tagArr })
      cancelEdit()
      await loadEntries()
    } catch {}
  }

  const doSearch = async () => {
    setListLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTag.trim()) params.set('tag', searchTag.trim())
      if (searchEmotion.trim()) params.set('emotion', searchEmotion.trim())
      const { data } = await api.get(`/journal/search?${params.toString()}`)
      setEntries(data)
    } catch {}
    setListLoading(false)
  }

  const onFiles = async (ev) => {
    const list = Array.from(ev.target.files || [])
    const mapped = await Promise.all(list.slice(0,3).map(f => toBase64(f).then(data => ({ type: f.type || 'application/octet-stream', data }))))
    setFiles(mapped)
  }

  const speak = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Speech recognition not supported in this browser')
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    r.onresult = (e) => {
      let s = ''
      for (let i=0; i<e.results.length; i++) s += e.results[i][0].transcript + ' '
      setText(prev => (prev ? prev + ' ' : '') + s.trim())
    }
    r.onerror = () => r.stop()
    r.onend = () => {}
    r.start()
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
        <h2 className="text-lg font-semibold mb-2">Daily Journal</h2>
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-white/80"><Sparkles size={16}/> Prompts</div>
            <button className="btn-secondary px-2 py-1" onClick={()=>insertPrompt(prompts[Math.floor(Math.random()*prompts.length)])}>
              <Shuffle size={14} className="mr-1"/> Surprise me
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {prompts.map((p,i)=> (
              <button key={i} className="btn-secondary whitespace-nowrap" onClick={()=>insertPrompt(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <textarea className="input h-40" placeholder="Write about your day..." value={text} onChange={e=>setText(e.target.value)} />
        <div className="mt-2 grid md:grid-cols-2 gap-2">
          <input className="input" placeholder="tags, comma-separated" value={tags} onChange={e=>setTags(e.target.value)} />
          <label className="flex items-center gap-2 text-sm text-white/80">
            <Paperclip size={16} /> Attach image/audio
            <input type="file" accept="image/*,audio/*" multiple onChange={onFiles} />
          </label>
        </div>
        <div className="mt-2 flex gap-2">
          <button className="btn-secondary" onClick={speak}><Mic size={16} className="mr-1"/> Voice</button>
          <button className="btn-primary" onClick={analyze} disabled={loading || !text.trim()}>
          {loading ? 'Analyzing...' : 'Analyze & Save'}
          </button>
        </div>
        {result && (
          <div className="mt-4">
            <div className="text-sm text-white/80 mb-1">AI Result</div>
            <div className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-0.5 rounded-full text-xs ${badge(result.emotion)}`}>{result.emotion}</span>
              <span>Stress:</span>
              <span className="font-semibold">{result.stress}</span>
            </div>
            <div className="mt-2 h-2 w-full bg-white/10 rounded">
              <div className="h-2 bg-rose-400 rounded" style={{ width: `${Math.min(100, Math.max(0, result.stress))}%` }} />
            </div>
          </div>
        )}
      </motion.div>
      <motion.div className="card" initial={{opacity:0, y:10}} animate={{opacity:1,y:0}}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Recent Entries</h2>
          <div className="flex gap-2 items-center">
            <input className="input" placeholder="Filter tag" value={searchTag} onChange={e=>setSearchTag(e.target.value)} />
            <input className="input" placeholder="Emotion (Happy/Sad/Angry/Anxious/Neutral)" value={searchEmotion} onChange={e=>setSearchEmotion(e.target.value)} />
            <button className="btn-secondary" onClick={doSearch}><Search size={16} className="mr-1"/>Search</button>
          </div>
        </div>
        <div className="space-y-3 max-h-80 overflow-auto pr-2">
          {listLoading && <div className="text-white/70 text-sm">Loading...</div>}
          {entries.map(e=> (
            <div key={e.id} className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-xs text-white/60">{new Date(e.createdAt).toLocaleString()}</div>
                <div className="flex gap-2">
                  <button className="btn-secondary px-2 py-1" title="Edit" onClick={()=>startEdit(e)}>
                    <Edit3 size={16} />
                  </button>
                  <button className="btn-secondary px-2 py-1" title="Delete" onClick={()=>del(e.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {editingId===e.id ? (
                <div className="mt-2 space-y-2">
                  <textarea className="input h-24" value={editingText} onChange={ev=>setEditingText(ev.target.value)} />
                  <input className="input" placeholder="tags, comma-separated" value={editingTags} onChange={ev=>setEditingTags(ev.target.value)} />
                  <div className="flex gap-2">
                    <button className="btn-primary" onClick={()=>saveEdit(e.id)}><Save size={16} className="mr-1"/>Save</button>
                    <button className="btn-secondary" onClick={cancelEdit}><X size={16} className="mr-1"/>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">{e.content}</div>
              )}
              <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                <span className={`px-2 py-0.5 rounded-full text-xs ${badge(e.emotion)}`}>{e.emotion}</span>
                <span>Stress {e.stress}</span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-white/10 rounded">
                <div className="h-1.5 bg-rose-400 rounded" style={{ width: `${Math.min(100, Math.max(0, e.stress))}%` }} />
              </div>
              {!!(e.tags||[]).length && (
                <div className="mt-2 text-xs text-white/70">Tags: {(e.tags||[]).join(', ')}</div>
              )}
              {!!(e.attachments||[]).length && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(e.attachments||[]).map((a,i)=> (
                    <AttachmentThumb key={i} a={a} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {!entries.length && <div className="text-white/60">No entries yet.</div>}
        </div>
      </motion.div>
    </div>
  )
}

function badge(emotion){
  const e = (emotion||'').toLowerCase()
  if (e.includes('happy')) return 'bg-emerald-500/30 border border-emerald-400/40'
  if (e.includes('sad')) return 'bg-sky-500/20 border border-sky-400/40'
  if (e.includes('ang')) return 'bg-orange-500/30 border border-orange-400/40'
  if (e.includes('anx')) return 'bg-rose-500/30 border border-rose-400/40'
  return 'bg-white/10 border border-white/20'
}

function AttachmentThumb({ a }){
  if ((a.type||'').startsWith('image/')) return <img src={a.data} alt="attachment" className="w-full h-24 object-cover rounded" />
  if ((a.type||'').startsWith('audio/')) return <audio src={a.data} controls className="w-full" />
  return <div className="text-xs text-white/70">Attachment</div>
}

function toBase64(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
