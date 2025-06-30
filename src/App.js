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
              "เบราว์เซอร์มือถือส่วนใหญ่จะไม่อนุญาตเข้าถึงตำแหน่งหากไม่ได้ใช้ HTTPS หรือ localhost\n" +
              "โปรดเปิดเว็บผ่าน https:// หรือทดสอบบน localhost เท่านั้น"
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
                alert("ไม่สามารถเข้าถึงตำแหน่งของคุณได้: " + error.message + "\nโปรดตรวจสอบว่าอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์มือถือแล้ว");
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