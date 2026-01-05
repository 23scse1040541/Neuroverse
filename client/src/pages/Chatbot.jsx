import React, { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'

export default function Chatbot() {
  const { token } = useAuth()
  const api = useMemo(()=>createClient(()=>token),[token])
  const [msgs, setMsgs] = useState([{from:'bot', text:'Hi! I’m here to listen. How are you feeling today?'}])
  const [text, setText] = useState('')
  const listRef = useRef(null)

  const send = async () => {
    const t = text.trim(); if (!t) return
    setMsgs(m=>[...m, {from:'user', text:t}])
    setText('')
    try {
      const { data } = await api.post('/chatbot', { message: t })
      setMsgs(m=>[...m, {from:'bot', text: data.reply}])
    } catch {
      setMsgs(m=>[...m, {from:'bot', text: 'Sorry, I had trouble responding.'}])
    }
    setTimeout(()=> listRef.current?.scrollTo({ top: 999999, behavior:'smooth' }), 100)
  }

  return (
    <div className="card max-w-3xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">Supportive Chat</h2>
      <div ref={listRef} className="h-80 overflow-auto space-y-2 pr-2">
        {msgs.map((m,i)=> (
          <motion.div key={i} initial={{opacity:0, y:5}} animate={{opacity:1,y:0}} className={`max-w-[80%] p-2 rounded-lg ${m.from==='user'?'ml-auto bg-primary-500':'bg-white/10'}`}>
            {m.text}
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="input flex-1" placeholder="Type your message..." value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} />
        <button className="btn-primary" onClick={send}>Send</button>
      </div>
    </div>
  )
}
