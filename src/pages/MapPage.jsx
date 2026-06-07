import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// 더미 데이터 (Supabase에 데이터 없을 때)
const DUMMY = [
  { id: '1', address: '부산 해운대구 중동 ○○아파트 302호', detail: '신축 풀옵션', deposit: 5000, monthly_rent: 70, area_sqm: 59, floor: 3, lat: 35.1631, lng: 129.1635, images: [] },
  { id: '2', address: '부산 수영구 광안동 ○○빌라 201호', detail: '바다뷰, 주차가능', deposit: 3000, monthly_rent: 55, area_sqm: 45, floor: 2, lat: 35.1536, lng: 129.1185, images: [] },
  { id: '3', address: '부산 남구 대연동 ○○오피스텔 501호', detail: '역세권, 올수리', deposit: 1000, monthly_rent: 45, area_sqm: 33, floor: 5, lat: 35.1368, lng: 129.0869, images: [] },
  { id: '4', address: '부산 동래구 온천동 ○○아파트 104호', detail: '초등학교 근처', deposit: 8000, monthly_rent: 0, area_sqm: 84, floor: 1, lat: 35.2047, lng: 129.0838, images: [] },
  { id: '5', address: '부산 북구 화명동 ○○아파트 802호', detail: '공원뷰, 조용한 단지', deposit: 6000, monthly_rent: 60, area_sqm: 72, floor: 8, lat: 35.2341, lng: 129.0198, images: [] },
]

function fmt(n) {
  if (!n) return '-'
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}억`
  return `${n.toLocaleString()}만`
}

function PinLabel({ property, selected, onClick }) {
  const map = useMap()
  const markerRef = useRef(null)

  const label = property.monthly_rent
    ? `${fmt(property.monthly_rent)}/월`
    : `전세 ${fmt(property.deposit)}`

  const icon = L.divIcon({
    className: '',
    html: `<div class="property-pin ${selected ? 'selected' : ''}">${label}</div>`,
    iconAnchor: [0, 0],
  })

  return (
    <Marker
      ref={markerRef}
      position={[property.lat, property.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(property)
      }}
    />
  )
}

function FlyTo({ property }) {
  const map = useMap()
  useEffect(() => {
    if (property) map.flyTo([property.lat, property.lng], 15, { duration: 0.8 })
  }, [property])
  return null
}

export default function MapPage() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState(DUMMY)
  const [selected, setSelected] = useState(null)
  const sliderRef = useRef(null)

  useEffect(() => {
    supabase
      .from('properties')
      .select('*, agents(name, office_name)')
      .eq('status', 'active')
      .then(({ data }) => {
        if (data && data.length > 0) setProperties(data)
      })
  }, [])

  function handlePinClick(property) {
    setSelected(property)
    // 해당 카드로 스크롤
    setTimeout(() => {
      const idx = properties.findIndex(p => p.id === property.id)
      if (sliderRef.current && idx >= 0) {
        const card = sliderRef.current.children[idx]
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }, 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%' }}>

      {/* 상단 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#fff',
        borderBottom: '1px solid #e4e4df', zIndex: 100, flexShrink: 0
      }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: '#1a3a6b' }}>단추</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#7a7a8a', alignSelf: 'center' }}>매물 {properties.length}개</span>
          <button
            className="btn-outline btn"
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20 }}
            onClick={() => navigate('/login')}
          >
            중개인 로그인
          </button>
        </div>
      </div>

      {/* 지도 — 화면의 55% */}
      <div style={{ flex: '0 0 55%', position: 'relative', zIndex: 1 }}>
        <MapContainer
          center={[35.1796, 129.0756]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {properties.map(p => (
            <PinLabel
              key={p.id}
              property={p}
              selected={selected?.id === p.id}
              onClick={handlePinClick}
            />
          ))}
          {selected && <FlyTo property={selected} />}
        </MapContainer>
      </div>

      {/* 하단 매물 카드 슬라이더 — 화면의 45% */}
      <div style={{
        flex: '0 0 45%', background: '#f2f2ef',
        borderTop: '1px solid #e4e4df', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '12px 16px 4px', flexShrink: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#3a3a4a' }}>
            {selected ? selected.address : '매물을 선택하세요'}
          </p>
        </div>

        <div className="card-slider" ref={sliderRef}>
          {properties.map(p => (
            <div
              key={p.id}
              className={`property-card ${selected?.id === p.id ? 'selected' : ''}`}
              onClick={() => {
                setSelected(p)
                navigate(`/property/${p.id}`)
              }}
            >
              {/* 방 사진 */}
              <div className="property-card-img">
                {p.images && p.images.length > 0
                  ? <img src={p.images[0]} alt="방 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>🏠</span>
                }
              </div>

              {/* 매물 정보 */}
              <div className="property-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, flex: 1, marginRight: 8, lineHeight: 1.4 }}>
                    {p.address}
                  </p>
                  <span className="badge badge-new" style={{ flexShrink: 0 }}>예약가능</span>
                </div>

                <p style={{ fontSize: 15, fontWeight: 700, color: '#1a3a6b', marginBottom: 4 }}>
                  {p.monthly_rent
                    ? `월세 ${fmt(p.deposit)} / ${fmt(p.monthly_rent)}`
                    : `전세 ${fmt(p.deposit)}`
                  }
                </p>

                <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#7a7a8a', marginBottom: 10 }}>
                  {p.area_sqm && <span>전용 {p.area_sqm}㎡</span>}
                  {p.floor && <span>{p.floor}층</span>}
                  {p.detail && <span>· {p.detail}</span>}
                </div>

                <div style={{
                  background: '#e8eef8', borderRadius: 8,
                  padding: '8px 12px', textAlign: 'center',
                  fontSize: 13, color: '#1a3a6b', fontWeight: 600
                }}>
                  방문 날짜 신청하기 →
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
