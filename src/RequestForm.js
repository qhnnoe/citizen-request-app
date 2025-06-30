import React, { useState } from 'react';

function RequestForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, contact, message });
    setName('');
    setContact('');
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>ชื่อ:</label>
        <input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label>เบอร์ติดต่อ:</label>
        <input value={contact} onChange={e => setContact(e.target.value)} required />
      </div>
      <div>
        <label>รายละเอียดคำร้อง:</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} required />
      </div>
      <button type="submit">ส่งคำร้อง</button>
    </form>
  );
}

// ไม่มีโค้ดแผนที่หรือ geolocation ใน RequestForm.js

// หมายเหตุสำคัญ:
// - ปัญหา geolocation ไม่เกี่ยวกับไฟล์นี้ (RequestForm.js)
// - ให้ตรวจสอบที่ไฟล์ App.js หรือไฟล์ที่ใช้ Leaflet/แผนที่
// - ถ้าเปิดเว็บผ่าน HTTPS แล้ว และกด Allow แล้วแต่ยังไม่ได้:
//   1. ลอง refresh หน้าเว็บใหม่
//   2. ลอง clear site data หรือ reset permission ใน browser มือถือ
//   3. ตรวจสอบว่าไม่ได้เปิดในโหมด incognito (บาง browser จะ block location)
//   4. ตรวจสอบว่า domain หรือ URL ที่เปิดตรงกับที่อนุญาตไว้

// สรุป: ไม่ต้องแก้ไข RequestForm.js
// ให้โฟกัสที่การอนุญาตตำแหน่ง, HTTPS, และโค้ดใน App.js ที่เกี่ยวกับแผนที่

export default RequestForm;