function showFloatingPopup() {
    const popup = document.createElement('div');
    popup.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #0a66c2;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        font-family: sans-serif;
        font-size: 14px;
        z-index: 9999;
      ">
        ✅ Job Tracker active
      </div>
    `;
  
    document.body.appendChild(popup);
  
    setTimeout(() => {
      popup.remove();
    }, 4000);
  }
  
  showFloatingPopup();
  