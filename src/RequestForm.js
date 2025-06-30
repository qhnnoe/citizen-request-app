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

export default RequestForm;