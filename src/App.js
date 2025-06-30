import React, { useState, useRef, useEffect } from 'react';
import logo from './logo.jpg';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    message: '',
    mediaFiles: [],
    latitude: '',
    longitude: ''
  });
  const [submitResult, setSubmitResult] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000/api/requests';

  useEffect(() => {
    import('leaflet').then(L => {
      // แก้ปัญหา marker icon ไม่แสดง
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
        iconUrl: require('leaflet/dist/images/marker-icon.png'),
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
      });

      if (mapRef.current && !mapRef.current._leaflet_id) {
        const map = L.map(mapRef.current, {
          tap: false // ปิด gesture tap บนมือถือที่อาจทำให้ map ไม่ตอบสนอง
        }).setView([12.616, 102.104], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        let marker = null;
        function setMarker(latlng) {
          if (marker) {
            marker.setLatLng(latlng);
          } else {
            marker = L.marker(latlng).addTo(map);
          }
          setForm(f => ({
            ...f,
            latitude: latlng.lat.toFixed(6),
            longitude: latlng.lng.toFixed(6)
          }));
        }

        map.on('click', function (e) {
          setMarker(e.latlng);
        });

        window.useMyLocation = function () {
          // แนะนำผู้ใช้มือถือให้เปิดเว็บผ่าน HTTPS หรือ localhost
          if (
            window.location.protocol !== 'https:' &&
            window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1'
          ) {
            alert(
              "มือถือจะใช้ตำแหน่งได้เฉพาะเมื่อเปิดผ่าน HTTPS หรือ localhost เท่านั้น\n" +
              "ถ้า deploy จริงควรเปิดผ่าน https:// หรือใช้บริการเช่น ngrok หรือ cloud ที่รองรับ SSL"
            );
            return;
          }
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLatLng = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                };
                map.setView(userLatLng, 15);
                setMarker(userLatLng);
              },
              (error) => {
                if (error.code === 1) {
                  alert("คุณไม่ได้อนุญาตให้เข้าถึงตำแหน่ง กรุณาอนุญาตใน browser แล้วลองใหม่");
                } else {
                  alert("ไม่สามารถเข้าถึงตำแหน่งของคุณได้: " + error.message);
                }
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }
            );
          } else {
            alert("เบราว์เซอร์ไม่รองรับ Geolocation");
          }
        };
      }
    });
  }, []);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'mediaFiles') {
      setForm(f => ({ ...f, mediaFiles: Array.from(files) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setSubmitResult('');
    // ตรวจสอบตำแหน่ง
    if (!form.latitude || !form.longitude) {
      setSubmitResult('กรุณาเลือกตำแหน่งบนแผนที่หรือใช้ตำแหน่งของฉัน');
      setLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('phone', form.phone);
    formData.append('address', form.address);
    formData.append('message', form.message);
    formData.append('latitude', form.latitude);
    formData.append('longitude', form.longitude);
    form.mediaFiles.forEach(file => {
      formData.append('mediaFiles', file);
    });

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setSubmitResult(data.message || 'ส่งคำร้องสำเร็จ!');
        setForm({
          name: '',
          phone: '',
          address: '',
          message: '',
          mediaFiles: [],
          latitude: '',
          longitude: ''
        });
        document.getElementById('mediaFiles').value = '';
      } else {
        const text = await res.text();
        setSubmitResult('เกิดข้อผิดพลาดในการส่งคำร้อง: ' + text);
      }
    } catch (err) {
      setSubmitResult('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ' + err.message + '\nโปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือสัญญาณมือถือ');
    }
    setLoading(false);
  };

  return (
    <div className="bg-logo">
      <nav>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="โลโก้ อบต.ท่าช้าง" />
          <span>องค์การบริหารส่วนตำบลท่าช้าง จ.จันทบุรี</span>
        </div>
        <div>
          <i className="bi bi-envelope"></i> ส่งคำร้อง
        </div>
      </nav>

      <section className="layout">
        <div className="map-section">
          <div id="map" ref={mapRef}></div>
          <button
            type="button"
            className="use-location-btn"
            onClick={() => window.useMyLocation && window.useMyLocation()}
          >
            📍 ใช้ตำแหน่งของฉัน
          </button>
        </div>
        <div className="form-section">
          <h2>ส่งคำร้อง</h2>
          {submitResult && (
            <div
              style={{
                color:
                  submitResult.includes('สำเร็จ') ||
                  submitResult.includes('เรียบร้อย')
                    ? 'green'
                    : 'red',
                marginBottom: 8,
                fontWeight: 'bold',
                fontSize: 18
              }}
            >
              {submitResult}
            </div>
          )}
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <input type="hidden" name="latitude" value={form.latitude} readOnly />
            <input type="hidden" name="longitude" value={form.longitude} readOnly />

            <label>ชื่อ:</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="เช่น นายสมชาย ใจดี"
            />

            <label>เบอร์โทรศัพท์:</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
              placeholder="เช่น 0891234567"
            />

            <label>ที่อยู่:</label>
            <textarea
              name="address"
              rows={2}
              value={form.address}
              onChange={handleChange}
              required
              placeholder="บ้านเลขที่ 123 หมู่ 4 ตำบลท่าช้าง อำเภอเมือง จังหวัดจันทบุรี"
            />

            <label>ข้อความ:</label>
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              required
              placeholder="เช่น ไฟฟ้าดับหลายวัน ถนนชำรุด น้ำประปาไม่ไหล"
            />

            <label>แนบรูปภาพหรือวิดีโอ:</label>
            <input
              type="file"
              name="mediaFiles"
              id="mediaFiles"
              multiple
              accept="image/*,video/*"
              onChange={handleChange}
            />

            <button type="submit" disabled={loading}>
              {loading ? 'กำลังส่ง...' : '📩 ส่งคำร้อง'}
            </button>
          </form>
        </div>
      </section>

      <footer>
        © 2025 องค์การบริหารส่วนตำบลท่าช้าง จังหวัดจันทบุรี
      </footer>
    </div>
  );
}

export default App;

// หมายเหตุสำหรับ geolocation ใน App.js:
// - ต้อง import 'leaflet/dist/leaflet.css' และติดตั้ง leaflet ให้ถูกต้อง
// - ฟังก์ชัน window.useMyLocation ต้องถูกเรียกตอนกดปุ่ม "ใช้ตำแหน่งของฉัน"
// - ถ้าเปิดเว็บผ่าน HTTPS หรือ localhost มือถือถึงจะอนุญาต geolocation
// - ถ้าใช้ cloud หรือ ngrok แล้ว ยังไม่ได้ ให้ตรวจสอบว่า domain เป็น https:// และไม่ได้ block location
// - ถ้า error เป็น "User Denied Geolocation" แปลว่าผู้ใช้หรือ browser block location (ต้อง Allow ใหม่)
// - ถ้า error เป็น "origin does not have permission" แปลว่าไม่ได้เปิดผ่าน HTTPS หรือ localhost

// ตัวอย่างโค้ดที่ถูกต้อง (ย่อ):
/*
useEffect(() => {
  import('leaflet').then(L => {
    // ...existing code...
    window.useMyLocation = function () {
      if (
        location.protocol !== 'https:' &&
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1'
      ) {
        alert("มือถือจะใช้ตำแหน่งได้เฉพาะเมื่อเปิดผ่าน HTTPS หรือ localhost เท่านั้น");
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // ...set marker...
          },
          (error) => {
            alert("ไม่สามารถเข้าถึงตำแหน่งของคุณได้: " + error.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        alert("เบราว์เซอร์ไม่รองรับ Geolocation");
      }
    };
    // ...existing code...
  });
}, []);
*/

// สรุป: ถ้าเปิดผ่าน HTTPS และ Allow แล้ว มือถือจะใช้ตำแหน่งได้
// ถ้ายังไม่ได้ ให้ reset permission หรือเปลี่ยน browser

// หมายเหตุเกี่ยวกับ error manifest.json และ favicon.ico:
// - ข้อความ "Failed to load resource: net::ERR_HTTP2_PROTOCOL_ERROR" สำหรับ manifest.json และ favicon.ico
//   มักเกิดจากปัญหา CDN, proxy, หรือ server ที่ให้บริการไฟล์ static เหล่านี้
// - ไม่กระทบการทำงานหลักของ React app (เว้นแต่ต้องใช้ favicon หรือ manifest จริง ๆ)
// - ถ้า deploy บน Vercel หรือ cloud ให้แน่ใจว่าไฟล์ public/manifest.json และ public/favicon.ico มีอยู่จริงในโปรเจกต์
// - ตรวจสอบว่าใน public/index.html มีบรรทัดเหล่านี้:
//   <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
//   <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
// - ถ้าใช้ custom domain หรือ proxy ให้แน่ใจว่าเส้นทางไฟล์ static ถูกต้อง

// สรุป: 
// - เพิ่มไฟล์ favicon.ico และ manifest.json ใน public/
// - ปัญหานี้ไม่เกี่ยวกับโค้ดใน App.js
// - ถ้าไม่ต้องการ error นี้ ให้ตรวจสอบไฟล์ใน public/ และเส้นทางใน index.html ให้ถูกต้อง