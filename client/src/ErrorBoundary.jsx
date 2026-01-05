import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error){
    return { error }
  }
  componentDidCatch(error, info){
    console.error('Neuroverse runtime error:', error, info)
  }
  render(){
    if (this.state.error) {
      const e = this.state.error
      return (
        <div style={{ padding:16, background:'#fee', color:'#900', border:'1px solid #fca' }}>
          <div style={{ fontWeight:600 }}>An error occurred</div>
          <div style={{ marginTop:8, whiteSpace:'pre-wrap' }}>{String(e?.stack || e?.message || e)}</div>
        </div>
      )
    }
    return this.props.children
  }
}
