import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

const DUMMY = {
  '1': { id:'1', address:'부산 해운대구 중동 ○○아파트 302호', detail:'신축 풀옵션', deposit:5000, monthly_rent:70, area_sqm:59, floor:3, description:'채광 좋고 역세권입니다.', agents:{name:'김중개', office_name:'해운대공인중개사', phone:'051-000-0000'}, images:[] },
  '2': { id:'2', address:'부산 수영구 광안동 ○○빌라 201호', detail:'바다뷰, 주차가능', deposit:3000, monthly_rent:55, area_sqm:45, floor:2, description:'광안리 바다가 보이는 뷰.', agents:{name:'이중개', office_name:'수영공인중개사', phone:'051-111-1111'}, images:[] },
}

const TIMES = ['09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00']
const DAY_KO = ['일','월','화','수','목','금','토']

function fmt(n) {
  if (!n) return '-'
  if (n >= 10000) return `${(n/10000).toFixed(n%10000===0?0:1)}억`
  return `${n.toLocaleString()}만`
}

function getNext14Days() {
  return Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i+1);return d})
}

export default function PropertyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast, Toast } = useToast()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlots, setSelectedSlots] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const days = getNext14Days()

  useEffect(() => {
    supabase.from('properties').select('*, agents(name,office_name,phone)').eq('id',id).single()
      .then(({data}) => {
        setProperty(data || DUMMY[id] || null)
        setLoading(false)
      })
  }, [id])

  function toggleSlot(date, time) {
    const key = `${date}_${time}`
    setSelectedSlots(prev => {
      if (prev.find(s=>`${s.date}_${s.time}`===key)) return prev.filter(s=>`${s.date}_${s.time}`!==key)
      if (prev.length>=3) { showToast('최대 3개까지 선택 가능해요'); return prev }
      return [...prev,{date,time}]
    })
  }

  async function handleSubmit() {
    if (selectedSlots.length===0) { showToast('희망 날짜를 선택해 주세요'); return }
    setSubmitting(true)
    const {error} = await supabase.from('visit_requests').insert({property_id:id, preferred_slots:selectedSlots, status:'pending'})
    setSubmitting(false)
    if (error) { showToast('오류가 발생했습니다'); return }
    setDone(true)
  }

  if (loading) return <div style={{height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div>
  if (!property) return <div style={{padding:40,textAlign:'center',color:'#7a7a8a'}}>매물을 찾을 수 없습니다</div>

  if (done) return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,textAlign:'center'}}>
      <div style={{fontSize:52,marginBottom:16}}>📅</div>
      <p style={{fontWeight:700,fontSize:18,marginBottom:10}}>방문 신청 완료!</p>
      <p style={{fontSize:14,color:'#7a7a8a',lineHeight:1.7,marginBottom:28}}>중개인이 임대인과 협의 후 확정합니다.</p>
      <div style={{background:'#f2f2ef',borderRadius:12,padding:16,marginBottom:24,width:'100%',maxWidth:320,textAlign:'left'}}>
        <p style={{fontSize:12,color:'#7a7a8a',marginBottom:8}}>신청한 희망 날짜</p>
        {selectedSlots.map((s,i)=><p key={i} style={{fontSize:14,fontWeight:500,padding:'3px 0'}}>📅 {s.date} {s.time}</p>)}
      </div>
      <button className="btn btn-outline" style={{width:'auto',padding:'10px 24px'}} onClick={()=>navigate('/')}>지도로 돌아가기</button>
    </div>
  )

  return (
    <div style={{height:'100dvh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {Toast}
      {/* 헤더 */}
      <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid #e4e4df',background:'#fff',flexShrink:0}}>
        <button onClick={()=>navigate(-1)} style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:'#3a3a4a',marginRight:8}}>←</button>
        <span style={{fontSize:14,fontWeight:600}}>매물 상세</span>
      </div>

      {/* 스크롤 영역 */}
      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
        {/* 방 사진 */}
        <div style={{width:'100%',height:200,background:'#f2f2ef',display:'flex',alignItems:'center',justifyContent:'center',fontSize:48,color:'#7a7a8a'}}>
          {property.images?.length>0 ? <img src={property.images[0]} style={{width:'100%',height:'100%',objectFit:'cover'}} alt="방사진"/> : '🏠'}
        </div>

        <div style={{padding:16}}>
          {/* 기본 정보 */}
          <div style={{marginBottom:16}}>
            <p style={{fontWeight:700,fontSize:17,marginBottom:4}}>{property.address}</p>
            {property.detail && <p style={{fontSize:13,color:'#7a7a8a',marginBottom:8}}>{property.detail}</p>}
            <p style={{fontSize:20,fontWeight:700,color:'#1a3a6b',marginBottom:4}}>
              {property.monthly_rent ? `월세 ${fmt(property.deposit)} / ${fmt(property.monthly_rent)}` : `전세 ${fmt(property.deposit)}`}
            </p>
            <div style={{display:'flex',gap:12,fontSize:13,color:'#7a7a8a'}}>
              {property.area_sqm&&<span>전용 {property.area_sqm}㎡</span>}
              {property.floor&&<span>{property.floor}층</span>}
            </div>
          </div>

          {property.description && (
            <div style={{padding:'12px 0',borderTop:'1px solid #e4e4df',borderBottom:'1px solid #e4e4df',marginBottom:16}}>
              <p style={{fontSize:13,color:'#3a3a4a',lineHeight:1.7}}>{property.description}</p>
            </div>
          )}

          {property.agents && (
            <div style={{fontSize:13,color:'#7a7a8a',marginBottom:20}}>
              🏢 {property.agents.office_name||property.agents.name}
              {property.agents.phone&&` · ${property.agents.phone}`}
            </div>
          )}

          {/* 날짜 선택 */}
          <p style={{fontSize:16,fontWeight:700,marginBottom:6}}>방문 희망 날짜 선택</p>
          <p style={{fontSize:13,color:'#7a7a8a',marginBottom:12}}>최대 3개까지 선택 가능합니다</p>

          {/* 날짜 스크롤 */}
          <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:14,scrollbarWidth:'none'}}>
            {days.map(d=>{
              const key=d.toISOString().split('T')[0]
              const isActive=selectedDay===key
              const hasSel=selectedSlots.some(s=>s.date===key)
              const isWeekend=d.getDay()===0||d.getDay()===6
              return (
                <button key={key} onClick={()=>setSelectedDay(key)} style={{
                  flexShrink:0,minWidth:52,padding:'8px 10px',borderRadius:10,
                  border:isActive?'1.5px solid #1a3a6b':'1px solid #e4e4df',
                  background:isActive?'#e8eef8':'#fff',
                  color:isActive?'#1a3a6b':isWeekend?'#c0392b':'#3a3a4a',
                  fontWeight:isActive?700:400,cursor:'pointer',textAlign:'center',position:'relative',fontFamily:'inherit'
                }}>
                  <span style={{display:'block',fontSize:10,marginBottom:2}}>{DAY_KO[d.getDay()]}</span>
                  <span style={{fontSize:14}}>{d.getDate()}</span>
                  {hasSel&&<span style={{position:'absolute',top:3,right:3,width:6,height:6,borderRadius:'50%',background:'#1a3a6b'}}/>}
                </button>
              )
            })}
          </div>

          {/* 시간 선택 */}
          {selectedDay ? (
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
              {TIMES.map(t=>{
                const sel=selectedSlots.some(s=>s.date===selectedDay&&s.time===t)
                return (
                  <button key={t} onClick={()=>toggleSlot(selectedDay,t)} style={{
                    padding:'10px 8px',border:sel?'1.5px solid #1a3a6b':'1px solid #e4e4df',
                    borderRadius:10,background:sel?'#e8eef8':'#fff',
                    color:sel?'#1a3a6b':'#3a3a4a',fontWeight:sel?600:400,
                    fontSize:13,cursor:'pointer',fontFamily:'inherit',textAlign:'center'
                  }}>
                    {t}<br/><span style={{fontSize:10,color:'inherit'}}>{sel?'✓ 선택':'선택'}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{textAlign:'center',padding:20,background:'#f2f2ef',borderRadius:10,color:'#7a7a8a',fontSize:13,marginBottom:16}}>
              위에서 날짜를 먼저 선택해 주세요
            </div>
          )}

          {/* 선택 요약 */}
          {selectedSlots.length>0&&(
            <div style={{background:'#e8eef8',border:'1px solid #1a3a6b',borderRadius:10,padding:'12px 14px',marginBottom:16}}>
              <p style={{fontSize:12,fontWeight:700,color:'#1a3a6b',marginBottom:8}}>선택한 날짜 ({selectedSlots.length}/3)</p>
              {selectedSlots.map((s,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0'}}>
                  <span style={{fontSize:13,color:'#1a3a6b',fontWeight:500}}>{s.date} {s.time}</span>
                  <button onClick={()=>setSelectedSlots(p=>p.filter((_,idx)=>idx!==i))} style={{background:'none',border:'none',color:'#7a7a8a',fontSize:18,cursor:'pointer'}}>×</button>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting||selectedSlots.length===0}>
            {submitting ? '신청 중...' : `방문 신청하기${selectedSlots.length > 0 ? ` (${selectedSlots.length}개)` : ''}`}
          </button>
          <p style={{fontSize:12,color:'#7a7a8a',textAlign:'center',marginTop:10}}>개인정보를 수집하지 않습니다</p>
        </div>
      </div>
    </div>
  )
}
