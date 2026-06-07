import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'

function fmt(n) {
  if (!n) return '-'
  if (n >= 10000) return `${(n/10000).toFixed(n%10000===0?0:1)}억`
  return `${n.toLocaleString()}만`
}

// ─── 로그인 ───
export function LoginPage() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) { setError('올바른 이메일을 입력해 주세요'); return }
    setLoading(true)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #e4e4df'}}>
        <button onClick={()=>navigate('/')} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#3a3a4a',marginRight:8}}>←</button>
        <span style={{fontSize:14,fontWeight:600}}>중개인 로그인</span>
      </div>
      <div style={{padding:'40px 24px'}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:32,color:'#1a3a6b',marginBottom:8}}>단추</div>
        <p style={{fontSize:14,color:'#7a7a8a',marginBottom:32}}>공인중개사 전용 로그인</p>
        {sent ? (
          <div style={{textAlign:'center',padding:32,background:'#f2f2ef',borderRadius:16}}>
            <div style={{fontSize:44,marginBottom:12}}>📬</div>
            <p style={{fontWeight:600,marginBottom:8}}>이메일을 확인해 주세요</p>
            <p style={{fontSize:13,color:'#7a7a8a',lineHeight:1.7}}>{email}으로<br/>로그인 링크를 보냈습니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">이메일</label>
              <input className="input" type="email" placeholder="agency@example.com" value={email} onChange={e=>{setEmail(e.target.value);setError('')}} />
            </div>
            {error && <p style={{fontSize:13,color:'#8b1a1a',marginBottom:12}}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading?'전송 중...':'로그인 링크 받기'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── 온보딩 ───
export function OnboardPage() {
  const { fetchAgent } = useAuth()
  const [form, setForm] = useState({name:'',license_no:'',office_name:'',phone:''})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name||!form.license_no) { setError('이름과 자격증 번호는 필수입니다'); return }
    setLoading(true)
    const {data:{user}} = await supabase.auth.getUser()
    const {error} = await supabase.from('agents').insert({id:user.id,email:user.email,...form})
    setLoading(false)
    if (error) setError(error.message)
    else fetchAgent(user.id)
  }

  return (
    <div style={{height:'100dvh',overflowY:'auto'}}>
      <div style={{padding:'16px 16px 12px',borderBottom:'1px solid #e4e4df'}}>
        <p style={{fontSize:14,fontWeight:600}}>중개사 정보 등록</p>
      </div>
      <div style={{padding:20}}>
        <p style={{fontSize:13,color:'#7a7a8a',marginBottom:20}}>서비스 이용을 위해 공인중개사 정보를 등록해 주세요.</p>
        <form onSubmit={handleSubmit}>
          <div className="field"><label className="label">이름 *</label><input className="input" placeholder="홍길동" value={form.name} onChange={set('name')}/></div>
          <div className="field"><label className="label">자격증 번호 *</label><input className="input" placeholder="제 00-000000 호" value={form.license_no} onChange={set('license_no')}/></div>
          <div className="field"><label className="label">중개사무소 상호</label><input className="input" placeholder="○○부동산" value={form.office_name} onChange={set('office_name')}/></div>
          <div className="field"><label className="label">연락처</label><input className="input" type="tel" placeholder="010-0000-0000" value={form.phone} onChange={set('phone')}/></div>
          {error&&<p style={{fontSize:13,color:'#8b1a1a',marginBottom:12}}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'등록 중...':'등록 완료'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── 대시보드 ───
export function DashboardPage() {
  const {agent, signOut} = useAuth()
  const navigate = useNavigate()
  const {showToast, Toast} = useToast()
  const [tab, setTab] = useState('properties')
  const [properties, setProperties] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (agent) fetchAll() }, [agent])

  async function fetchAll() {
    const {data:props} = await supabase.from('properties').select('*').eq('agent_id',agent.id).order('created_at',{ascending:false})
    const ids = (props||[]).map(p=>p.id)
    let reqs = []
    if (ids.length>0) {
      const {data} = await supabase.from('visit_requests').select('*,properties(address)').in('property_id',ids).order('created_at',{ascending:false})
      reqs = data||[]
    }
    setProperties(props||[])
    setRequests(reqs)
    setLoading(false)
  }

  async function updateReq(id, status) {
    await supabase.from('visit_requests').update({status}).eq('id',id)
    showToast(status==='confirmed'?'확정했습니다':'취소했습니다')
    fetchAll()
  }

  function copyLink(id) {
    navigator.clipboard.writeText(`${window.location.origin}/danchoo/property/${id}`)
    showToast('링크 복사 완료!')
  }

  const pendingCount = requests.filter(r=>r.status==='pending').length
  const STATUS = {pending:'협의중',confirmed:'확정',canceled:'취소'}
  const STATUS_CLS = {pending:'badge-pending',confirmed:'badge-confirmed',canceled:'badge-canceled'}

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column'}}>
      {Toast}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid #e4e4df',background:'#fff',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:'#1a3a6b'}}>단추</div>
          <div style={{fontSize:11,color:'#7a7a8a'}}>{agent?.office_name||agent?.name}</div>
        </div>
        <button className="btn-ghost btn" onClick={signOut} style={{fontSize:12,color:'#7a7a8a'}}>로그아웃</button>
      </div>

      <div style={{display:'flex',borderBottom:'1px solid #e4e4df',background:'#fff',flexShrink:0}}>
        {[{key:'properties',label:'내 매물'},{key:'requests',label:`방문 신청${pendingCount>0?` (${pendingCount})`:''}`}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1,padding:'13px 0',fontSize:14,fontWeight:tab===t.key?700:400,
            color:tab===t.key?'#1a3a6b':'#7a7a8a',background:'none',border:'none',cursor:'pointer',
            borderBottom:tab===t.key?'2px solid #1a3a6b':'2px solid transparent',fontFamily:'inherit'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:16}}>
        {loading && <div className="spinner"/>}

        {!loading && tab==='properties' && <>
          <button className="btn btn-primary" style={{marginBottom:16}} onClick={()=>navigate('/agent/property/new')}>+ 새 매물 등록</button>
          {properties.length===0&&<div className="empty"><div className="empty-icon">🏠</div><p style={{fontSize:14,color:'#7a7a8a'}}>등록된 매물이 없습니다</p></div>}
          {properties.map(p=>(
            <div key={p.id} style={{background:'#fff',border:'1px solid #e4e4df',borderRadius:16,padding:16,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:14,marginBottom:3}}>{p.address}</p>
                  <p style={{fontSize:13,color:'#1a3a6b'}}>{p.monthly_rent?`월세 ${fmt(p.deposit)} / ${fmt(p.monthly_rent)}`:`전세 ${fmt(p.deposit)}`}</p>
                </div>
                <span className={`badge ${p.status==='active'?'badge-confirmed':'badge-inactive'}`}>{p.status==='active'?'활성':'비활성'}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
                <button className="btn-outline btn" style={{fontSize:12,padding:'8px 0'}} onClick={()=>copyLink(p.id)}>🔗 링크</button>
                <button className="btn-outline btn" style={{fontSize:12,padding:'8px 0'}} onClick={()=>navigate(`/agent/property/${p.id}/edit`)}>✏️ 수정</button>
                <button className="btn-outline btn" style={{fontSize:12,padding:'8px 0'}} onClick={async()=>{await supabase.from('properties').update({status:p.status==='active'?'inactive':'active'}).eq('id',p.id);fetchAll()}}>
                  {p.status==='active'?'⏸ 중단':'▶ 활성'}
                </button>
              </div>
            </div>
          ))}
        </>}

        {!loading && tab==='requests' && <>
          {requests.length===0&&<div className="empty"><div className="empty-icon">📅</div><p style={{fontSize:14,color:'#7a7a8a'}}>방문 신청이 없습니다</p></div>}
          {requests.map(r=>(
            <div key={r.id} style={{background:'#fff',border:'1px solid #e4e4df',borderRadius:16,padding:16,marginBottom:12}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <p style={{fontWeight:700,fontSize:14,marginBottom:2}}>{r.properties?.address}</p>
                  <p style={{fontSize:12,color:'#7a7a8a'}}>{new Date(r.created_at).toLocaleDateString('ko-KR')} 신청</p>
                </div>
                <span className={`badge ${STATUS_CLS[r.status]}`}>{STATUS[r.status]}</span>
              </div>
              <div style={{background:'#f2f2ef',borderRadius:10,padding:'10px 12px',marginBottom:12}}>
                <p style={{fontSize:11,color:'#7a7a8a',marginBottom:6,fontWeight:500}}>희망 방문 날짜</p>
                {(r.preferred_slots||[]).map((s,i)=><p key={i} style={{fontSize:13,fontWeight:500,padding:'2px 0'}}>📅 {s.date} {s.time}</p>)}
              </div>
              {r.status==='pending'&&(
                <div style={{display:'flex',gap:8}}>
                  <button className="btn btn-primary" style={{flex:1,padding:10,fontSize:13}} onClick={()=>updateReq(r.id,'confirmed')}>✓ 확정</button>
                  <button className="btn" style={{flex:1,padding:10,fontSize:13,background:'#fceaea',color:'#8b1a1a',border:'none'}} onClick={()=>updateReq(r.id,'canceled')}>✕ 취소</button>
                </div>
              )}
            </div>
          ))}
        </>}
      </div>
    </div>
  )
}

// ─── 매물 등록/수정 ───
export function PropertyFormPage() {
  const {agent} = useAuth()
  const navigate = useNavigate()
  const {id} = useParams()
  const isEdit = id && id!=='new'
  const [form, setForm] = useState({address:'',detail:'',type:'monthly',deposit:'',monthly_rent:'',area_sqm:'',floor:'',description:'',lat:'',lng:''})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!!isEdit)
  const [error, setError] = useState('')
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    if (!isEdit) return
    supabase.from('properties').select('*').eq('id',id).single().then(({data})=>{
      if (data) setForm({address:data.address||'',detail:data.detail||'',type:data.monthly_rent?'monthly':'jeonse',deposit:data.deposit||'',monthly_rent:data.monthly_rent||'',area_sqm:data.area_sqm||'',floor:data.floor||'',description:data.description||'',lat:data.lat||'',lng:data.lng||''})
      setFetching(false)
    })
  },[id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.address) { setError('주소는 필수입니다'); return }
    setLoading(true); setError('')
    const payload = {
      address:form.address, detail:form.detail||null,
      deposit:form.deposit?parseInt(form.deposit):null,
      monthly_rent:form.type==='monthly'&&form.monthly_rent?parseInt(form.monthly_rent):null,
      area_sqm:form.area_sqm?parseFloat(form.area_sqm):null,
      floor:form.floor?parseInt(form.floor):null,
      description:form.description||null,
      lat:form.lat?parseFloat(form.lat):null,
      lng:form.lng?parseFloat(form.lng):null,
    }
    const {error} = isEdit
      ? await supabase.from('properties').update(payload).eq('id',id)
      : await supabase.from('properties').insert({...payload,agent_id:agent.id,status:'active'})
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/agent')
  }

  if (fetching) return <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #e4e4df',flexShrink:0}}>
        <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#3a3a4a',marginRight:8}}>←</button>
        <span style={{fontSize:14,fontWeight:600}}>{isEdit?'매물 수정':'새 매물 등록'}</span>
        {isEdit&&<button onClick={async()=>{if(confirm('삭제할까요?')){await supabase.from('properties').delete().eq('id',id);navigate('/agent')}}} style={{marginLeft:'auto',background:'none',border:'none',color:'#8b1a1a',fontSize:13,cursor:'pointer'}}>삭제</button>}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:20}}>
        <form onSubmit={handleSubmit}>
          <div className="field"><label className="label">주소 *</label><input className="input" placeholder="부산시 해운대구 중동 ○○아파트 302호" value={form.address} onChange={set('address')}/></div>
          <div className="field"><label className="label">상세 정보</label><input className="input" placeholder="신축, 풀옵션, 역세권 등" value={form.detail} onChange={set('detail')}/></div>
          <div className="field">
            <label className="label">임대 유형</label>
            <div style={{display:'flex',gap:8}}>
              {[['monthly','월세'],['jeonse','전세']].map(([v,l])=>(
                <button key={v} type="button" onClick={()=>setForm(f=>({...f,type:v}))} style={{flex:1,padding:11,borderRadius:10,border:form.type===v?'1.5px solid #1a3a6b':'1px solid #e4e4df',background:form.type===v?'#e8eef8':'#fff',color:form.type===v?'#1a3a6b':'#3a3a4a',fontWeight:form.type===v?700:400,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field"><label className="label">보증금(만원)</label><input className="input" type="number" placeholder="5000" value={form.deposit} onChange={set('deposit')}/></div>
            {form.type==='monthly'&&<div className="field"><label className="label">월세(만원)</label><input className="input" type="number" placeholder="70" value={form.monthly_rent} onChange={set('monthly_rent')}/></div>}
            <div className="field"><label className="label">전용면적(㎡)</label><input className="input" type="number" placeholder="59.9" value={form.area_sqm} onChange={set('area_sqm')}/></div>
            <div className="field"><label className="label">층수</label><input className="input" type="number" placeholder="3" value={form.floor} onChange={set('floor')}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field"><label className="label">위도(lat)</label><input className="input" type="number" step="any" placeholder="35.1631" value={form.lat} onChange={set('lat')}/></div>
            <div className="field"><label className="label">경도(lng)</label><input className="input" type="number" step="any" placeholder="129.1635" value={form.lng} onChange={set('lng')}/></div>
          </div>
          <p style={{fontSize:12,color:'#7a7a8a',marginBottom:16,marginTop:-8}}>구글 지도에서 주소 검색 후 우클릭 → 좌표 복사</p>
          <div className="field"><label className="label">매물 설명</label><textarea className="input" rows={3} placeholder="채광 좋음, 주차 가능..." value={form.description} onChange={set('description')} style={{resize:'vertical',lineHeight:1.6}}/></div>
          {error&&<p style={{fontSize:13,color:'#8b1a1a',marginBottom:12}}>{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading?'저장 중...':isEdit?'수정 완료':'등록 완료'}</button>
        </form>
      </div>
    </div>
  )
}
