const images = {
    hotel: [
      "img/raja.jpg"
      
    ],
    homestay: [
      "img/veg1.jpg",
      "img/veg2.jpg",
      "img/veg3.jpg"
    ],
    resort: [
      "img/swwet1.jpg",
      "img/sweet2.jpg",
      "img/sweet3.jpg"
    ]
  };
  
 
  
  let currentType = 'hotel';
  let qrVisible = false;
  
  function showContent(type) {
    currentType = type;
    qrVisible = false;
  
    const imageContainer = document.getElementById("imageContainer");
    const qrContainer = document.getElementById("qrContainer");
  
    imageContainer.innerHTML = "";
    qrContainer.innerHTML = "";
    qrContainer.style.display = "none";
  
    images[type].forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      imageContainer.appendChild(img);
    });
  }
  
  function toggleQR() {
    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "";
  
    qrCodes[currentType].forEach(src => {
      const qr = document.createElement("img");
      qr.src = src;
      qr.alt = "QR code";
      qrContainer.appendChild(qr);
    });
  
    qrContainer.style.display = qrVisible ? "none" : "flex";
    qrVisible = !qrVisible;
  }
  
  window.onload = () => {
    showContent('hotel');
  };
  