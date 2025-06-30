const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 4000;

// สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ตั้งค่า multer สำหรับรับไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// รับคำร้องพร้อมไฟล์แนบ
app.post('/api/requests', upload.array('mediaFiles', 10), (req, res) => {
  const { name, phone, address, message, latitude, longitude } = req.body;
  const files = req.files || [];
  // ตัวอย่าง: บันทึกข้อมูลลงไฟล์ (หรือฐานข้อมูลจริง)
  const data = {
    name, phone, address, message, latitude, longitude,
    files: files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      url: `/uploads/${f.filename}`
    })),
    createdAt: new Date().toISOString()
  };
  // เพิ่มข้อมูลลงไฟล์ log (append)
  fs.appendFileSync(path.join(__dirname, 'requests.log'), JSON.stringify(data) + '\n');
  res.json({ success: true, message: 'รับคำร้องเรียบร้อย', data });
});

// เพิ่ม endpoint สำหรับดูคำร้องทั้งหมด
app.get('/api/requests', (req, res) => {
  const logPath = path.join(__dirname, 'requests.log');
  if (!fs.existsSync(logPath)) {
    return res.json([]);
  }
  const lines = fs.readFileSync(logPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  res.json(lines);
});

// เพิ่ม route สำหรับ favicon.ico เพื่อป้องกัน 404 ใน browser
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// เพิ่มหน้า backend admin สำหรับดูข้อมูลคำร้อง (ต้องอยู่หลัง favicon และก่อน app.listen)
app.get('/admin', (req, res) => {
  console.log('GET /admin called');
  const logPath = path.join(__dirname, 'requests.log');
  let rows = '';
  let total = 0;
  if (fs.existsSync(logPath)) {
    const lines = fs.readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    total = lines.length;
    rows = lines.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${item.name || ''}</td>
        <td>${item.phone || ''}</td>
        <td>${item.address || ''}</td>
        <td>${item.message || ''}</td>
        <td>${item.latitude || ''}, ${item.longitude || ''}</td>
        <td>
          ${
            item.files && item.files.length
              ? item.files.map(f =>
                  `<a href="${f.url}" target="_blank">${f.originalname}</a>`
                ).join('<br/>')
              : '-'
          }
        </td>
        <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
      </tr>
    `).join('');
  }
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Admin - จัดการคำร้อง</title>
        <style>
          body { font-family: sans-serif; margin: 2em; background: #f8f9fa; }
          h2 { color: #2c3e50; }
          .admin-header { display: flex; justify-content: space-between; align-items: center; }
          .admin-header .count { color: #555; font-size: 1em; }
          table { border-collapse: collapse; width: 100%; background: #fff; }
          th, td { border: 1px solid #aaa; padding: 6px 10px; }
          th { background: #e9ecef; }
          tr:nth-child(even) { background: #f6f6f6; }
          a { color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="admin-header">
          <h2>ระบบผู้ดูแล - รายการคำร้องที่ได้รับ</h2>
          <span class="count">ทั้งหมด ${total} รายการ</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ชื่อ</th>
              <th>เบอร์โทร</th>
              <th>ที่อยู่</th>
              <th>ข้อความ</th>
              <th>พิกัด</th>
              <th>ไฟล์แนบ</th>
              <th>เวลาที่ส่ง</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" align="center">ยังไม่มีข้อมูล</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `);
});

// --- ส่วน serve frontend build ---
const frontendBuildPath = path.join(__dirname, '..', 'build');
if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  app.get('/admin', (req, res) => {
    const logPath = path.join(__dirname, 'requests.log');
    let rows = '';
    let total = 0;
    if (fs.existsSync(logPath)) {
      const lines = fs.readFileSync(logPath, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      total = lines.length;
      rows = lines.map((item, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.name || ''}</td>
          <td>${item.phone || ''}</td>
          <td>${item.address || ''}</td>
          <td>${item.message || ''}</td>
          <td>${item.latitude || ''}, ${item.longitude || ''}</td>
          <td>
            ${
              item.files && item.files.length
                ? item.files.map(f =>
                    `<a href="${f.url}" target="_blank">${f.originalname}</a>`
                  ).join('<br/>')
                : '-'
            }
          </td>
          <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
        </tr>
      `).join('');
    }
    res.send(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Admin - จัดการคำร้อง</title>
          <style>
            body { font-family: sans-serif; margin: 2em; background: #f8f9fa; }
            h2 { color: #2c3e50; }
            .admin-header { display: flex; justify-content: space-between; align-items: center; }
            .admin-header .count { color: #555; font-size: 1em; }
            table { border-collapse: collapse; width: 100%; background: #fff; }
            th, td { border: 1px solid #aaa; padding: 6px 10px; }
            th { background: #e9ecef; }
            tr:nth-child(even) { background: #f6f6f6; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="admin-header">
            <h2>ระบบผู้ดูแล - รายการคำร้องที่ได้รับ</h2>
            <span class="count">ทั้งหมด ${total} รายการ</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ชื่อ</th>
                <th>เบอร์โทร</th>
                <th>ที่อยู่</th>
                <th>ข้อความ</th>
                <th>พิกัด</th>
                <th>ไฟล์แนบ</th>
                <th>เวลาที่ส่ง</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="8" align="center">ยังไม่มีข้อมูล</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `);
  });

  // / = React frontend (index.html)
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });

  // path อื่นๆ (ยกเว้น /api, /uploads, /admin) = React frontend (index.html)
  app.get(/^\/(?!api|uploads|admin).*/, (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend started on http://localhost:${PORT}`);
});

// วิธีให้หน้า admin มีข้อมูลเข้ามา:
// 1. ต้องส่งคำร้องจากหน้า frontend (React) ให้สำเร็จอย่างน้อย 1 ครั้ง
// 2. ข้อมูลจะถูกบันทึกในไฟล์ requests.log และแสดงบนตารางหน้า admin อัตโนมัติ

// วิธีให้คนอื่นใช้ได้ทั้งหน้า frontend และ backend

// 1. สั่ง build React (frontend) ก่อน
//    - เปิด terminal ที่โฟลเดอร์ citizen-request-app
//    - รัน: npm run build
//    - จะได้โฟลเดอร์ build อยู่ใน citizen-request-app

// 2. รัน backend (Node.js/Express) ตามปกติ
//    - เปิด terminal ที่โฟลเดอร์ citizen-request-app/server
//    - รัน: node index.js

// 3. ให้คนอื่นเข้าผ่าน IP หรือ domain ของเครื่องนี้ เช่น
//    - http://<your-ip>:4000         (หน้า React สำหรับประชาชน)
//    - http://<your-ip>:4000/admin   (หน้า admin backend สำหรับดูคำร้อง)
//    - <your-ip> คือ IP address ของเครื่องที่รัน server (ดูได้จาก ipconfig หรือ ifconfig)

// 4. ตรวจสอบ firewall ให้เปิด port 4000 ด้วย
//    - ถ้าใช้ Windows ให้เปิด Windows Defender Firewall แล้วอนุญาต port 4000
//    - ถ้าใช้ cloud server ให้เปิด port 4000 ใน security group

// 5. ถ้าจะให้ใช้งานจากอินเทอร์เน็ต ต้องตั้งค่า port forwarding ที่ router หรือ deploy ไปยัง cloud

// 6. ทุกคนสามารถเข้าใช้งานได้ผ่าน browser โดยใช้ IP address ของเครื่อง server

// วิธีให้ใช้ได้จากทุกที่โดยมีแค่เว็บ (production-ready):
// 1. build React (npm run build) แล้ว
// 2. รัน backend (node index.js) บน server ที่เปิด port 4000
// 3. ให้คนอื่นเข้าผ่าน http://<public-ip>:4000 หรือ domain ที่ชี้มาที่ server นี้
// 4. ถ้าใช้ cloud หรือ VPS ให้เปิด port 4000 ใน firewall/cloud security group
// 5. ถ้าใช้ในองค์กร/บ้าน ให้ตั้งค่า port forwarding ที่ router (public IP → เครื่อง server port 4000)
// 6. ไม่ต้องติดตั้งอะไรเพิ่มที่ฝั่งผู้ใช้ แค่เปิด browser แล้วเข้า URL ได้เลย

// หมายเหตุ: 
// - ถ้าต้องการ HTTPS ให้ใช้ reverse proxy เช่น nginx หรือบริการ cloud ที่รองรับ SSL
// - ถ้าต้องการ domain name ให้จดโดเมนแล้วชี้มาที่ public IP ของ server

// ตัวอย่างโค้ดนี้ถูกต้องแล้ว ไม่ต้องแก้ไขเพิ่ม
// หากยังไม่มีข้อมูล ให้ไปที่หน้าเว็บ React กรอกฟอร์มและกด "ส่งคำร้อง"
// เมื่อส่งสำเร็จ กลับมาที่ http://localhost:4000 จะเห็นข้อมูลในตาราง
// หากยังไม่มีข้อมูล ให้ไปที่หน้าเว็บ React กรอกฟอร์มและกด "ส่งคำร้อง"
// เมื่อส่งสำเร็จ กลับมาที่ http://localhost:4000 จะเห็นข้อมูลในตาราง

// หมายเหตุสำหรับการเผยแพร่เว็บให้เป็นสาธารณะ (public link):
// 1. คุณต้องรัน backend (node index.js) บนเครื่องที่มี public IP หรือ cloud server
// 2. เปิด port 4000 ใน firewall และ router (port forwarding) ให้เข้าถึงจากอินเทอร์เน็ต
// 3. ถ้าอยู่ในวง LAN ให้คนในวงเดียวกันเข้าผ่าน http://<your-ip>:4000
// 4. ถ้าต้องการลิงก์สาธารณะง่าย ๆ ให้ใช้ ngrok (https://ngrok.com/)
//    - ติดตั้ง ngrok แล้วรัน: ngrok http 4000
//    - จะได้ลิงก์ https://xxxx.ngrok.io ส่งให้ใครก็เข้าถึงได้ทันที (รวมมือถือ)
// 5. ถ้าต้องการใช้งานจริงควร deploy ไปยัง cloud (เช่น AWS, Azure, GCP, Vercel, Render ฯลฯ) และตั้งค่า domain/SSL

// หมายเหตุสำหรับการใช้งานบนมือถือและให้คนทั่วไปใช้ได้ทุกคน (public + mobile geolocation):
// 1. ต้อง deploy หรือเปิดเว็บผ่าน HTTPS เท่านั้น (มือถือจะไม่อนุญาต geolocation ถ้าไม่ใช่ HTTPS หรือ localhost)
// 2. วิธีง่ายสุดสำหรับทดสอบ/ใช้งานจริง:
//    - ใช้ ngrok (https://ngrok.com/) เพื่อสร้าง public HTTPS URL ชั่วคราว
//      ตัวอย่าง:
//        1. ติดตั้ง ngrok (ดาวน์โหลดจากเว็บ ngrok.com)
//        2. เปิด terminal ที่ server แล้วรัน: ngrok http 4000
//        3. จะได้ลิงก์ https://xxxx.ngrok.io ส่งให้ใครก็เข้าได้ (รวมมือถือ)
//        4. มือถือจะใช้ geolocation ได้เพราะเป็น HTTPS
//    - หรือ deploy ไป cloud ที่รองรับ HTTPS (เช่น Vercel, Render, AWS, Azure, GCP, ฯลฯ)
//    - หรือใช้ reverse proxy (nginx, Caddy) ตั้งค่า SSL ให้กับ server

// 3. ถ้าใช้ในวง LAN เฉย ๆ (ไม่ใช่ HTTPS) มือถือจะไม่สามารถใช้ geolocation ได้ (ข้อจำกัดของ browser มือถือ)
// 4. ถ้าใช้ ngrok หรือ cloud แล้ว ทุกคน (รวมมือถือ) จะเข้าเว็บและใช้ geolocation ได้สมบูรณ์

// หมายเหตุ: ถ้าใช้ ngrok แล้วลิงก์ไม่ทำงาน ให้ตรวจสอบว่าได้รันคำสั่ง ngrok http 4000 ถูกต้องหรือไม่
// และตรวจสอบว่า backend กำลังรันอยู่บน port 4000 หรือไม่
// หากใช้ cloud server ให้ตรวจสอบว่าได้เปิด port 4000 ใน firewall/cloud security group หรือไม่
// หากใช้ในองค์กร/บ้าน ให้ตรวจสอบการตั้งค่า router ว่าได้ทำ port forwarding ถูกต้องหรือไม่
// หากยังมีปัญหา ให้ลองรีสตาร์ทเซิร์ฟเวอร์หรือดูที่ log เพื่อตรวจสอบข้อผิดพลาด
