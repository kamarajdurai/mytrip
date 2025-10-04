const GEMINI_KEY = "AIzaSyDq8yv0a1IhX6C82W2D3KJkCeMaw8kv2Lo";
const WEATHER_KEY = "b2c5b477f503ea54bffa1455a210ff49";

document.addEventListener('DOMContentLoaded', () => {
  setupWeatherAnimations();

  document.querySelectorAll('#travelTypeOptions .option-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      document.querySelectorAll('#travelTypeOptions .option-card').forEach(c=>c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  document.querySelectorAll('#budgetOptions .option-card').forEach(card=>{
    card.addEventListener('click', ()=>{
      document.querySelectorAll('#budgetOptions .option-card').forEach(c=>c.classList.remove('active'));
      card.classList.add('active');
    });
  });
});

function setupWeatherAnimations() {
  if(!document.querySelector('.weather-bg')) {
    const bgDiv = document.createElement('div');
    bgDiv.className = 'weather-bg';
    document.body.appendChild(bgDiv);
  }
}

function setWeatherAnimation(weatherType) {
  const oldAnim = document.querySelector('.weather-animation');
  if(oldAnim) oldAnim.remove();
  const anim = document.createElement('div');
  anim.className = `weather-animation ${weatherType}`;
  anim.textContent = weatherType==='rain'?'🌧️':weatherType==='clouds'?'☁️':'☀️';
  document.body.appendChild(anim);

  const bgDiv = document.querySelector('.weather-bg');
  bgDiv.style.background = weatherType==='rain' ? 'linear-gradient(to bottom,#4682B4,#708090)' : weatherType==='clouds' ? 'linear-gradient(to bottom,#B0C4DE,#778899)' : 'linear-gradient(to bottom,#87CEEB,#1E90FF)';
}

function getDaysInRange(startDate,endDate){
  const start=new Date(startDate);
  const end=new Date(endDate);
  const days=[];
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)) days.push(new Date(d));
  return days;
}

async function generatePlan(){
  const city=document.getElementById("cityInput").value.trim();
  const startDate=document.getElementById("startDate").value;
  const endDate=document.getElementById("endDate").value;
  const travelType=document.querySelector('#travelTypeOptions .option-card.active').dataset.value;
  const budget=document.querySelector('#budgetOptions .option-card.active').dataset.value;
  const customPrompt=document.getElementById("customPrompt").value.trim();
  const output=document.getElementById("output");
  const downloadBtn=document.getElementById("downloadBtn");
  downloadBtn.style.display="none";
  output.classList.remove("show");

  if(customPrompt) return await sendToGemini(customPrompt,output);

  if(!city) return output.textContent="❗ Please enter a city name.";
  if(!startDate||!endDate) return output.textContent="📅 Please select both start and end dates.";

  output.textContent="🌦 Getting weather forecast...";
  output.classList.add("show");

  try {
    const days=getDaysInRange(startDate,endDate);
    const weatherUrl=`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_KEY}&units=metric`;
    const weatherRes=await fetch(weatherUrl);
    const weatherData=await weatherRes.json();

    if(weatherData.cod!=="200") return output.textContent="⚠️ City not found. Try again.";

    const forecastMap=new Map();
    weatherData.list.forEach(entry=>{
      const date=entry.dt_txt.split(" ")[0];
      if(!forecastMap.has(date)) forecastMap.set(date,entry);
    });

    let weatherInfo=`Weather forecast for ${city}:\n\n`;
    let dailySummaries=[];

    days.forEach((day,i)=>{
      const dateStr=day.toISOString().split("T")[0];
      const forecast=forecastMap.get(dateStr);
      if(forecast){
        const desc=forecast.weather[0].description;
        const temp=forecast.main.temp;
        const weatherType=forecast.weather[0].main.toLowerCase();
        weatherInfo+=`${day.toDateString()}: ${desc}, ${temp}°C\n`;
        dailySummaries.push({day:i+1,date:day.toDateString(),description:desc,temp,weatherType});
        setTimeout(()=>setWeatherAnimation(weatherType),i*500);
      }else{
        weatherInfo+=`${day.toDateString()}: No forecast data.\n`;
      }
    });

    setTimeout(async()=>{
      output.textContent=`${weatherInfo}\n\nGenerating trip plan...`;
      const planPrompt=`Create a ${days.length}-day Tamil Nadu trip plan for ${city} from ${startDate} to ${endDate}.
Travel Type: ${travelType}
Budget: ${budget}
Weather info: ${dailySummaries.map(d=>`Day ${d.day} (${d.date}): ${d.description}, ${d.temp}°C`).join('\n')}
Generate day-wise plan.`;
      await sendToGemini(planPrompt,output,weatherInfo);
    },days.length*500);

  } catch(err){
    console.error(err);
    output.textContent="❌ Something went wrong. Please try again.";
  }
}

async function sendToGemini(prompt,output,weatherInfo=""){
  try{
    const geminiRes=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const geminiData=await geminiRes.json();
    const downloadBtn=document.getElementById("downloadBtn");

    if(geminiData.candidates?.[0]?.content?.parts?.[0]?.text){
      output.textContent=`${weatherInfo}\n\n${geminiData.candidates[0].content.parts[0].text}`;
      output.classList.add("show");
      downloadBtn.style.display="block";
    }else{
      output.textContent=`${weatherInfo}\n\nCould not generate trip plan. Try again.`;
      output.classList.add("show");
      downloadBtn.style.display="none";
    }
  }catch(e){
    console.error(e);
    output.textContent="❌ Failed to contact Gemini API.";
    output.classList.add("show");
    document.getElementById("downloadBtn").style.display="none";
  }
}

function downloadPDF(){
  const { jsPDF }=window.jspdf;
  const doc=new jsPDF();
  const outputText=document.getElementById("output").textContent;
  const pageWidth=doc.internal.pageSize.getWidth();
  const margin=10;
  const lines=doc.splitTextToSize(outputText,pageWidth-2*margin);
  doc.text(lines,margin,20);
  const city=document.getElementById("cityInput").value.trim()||"Trip_Plan";
  const safeCityName=city.replace(/[^a-z0-9]/gi,"_");
  doc.save(`${safeCityName}_Trip_Plan.pdf`);
}
