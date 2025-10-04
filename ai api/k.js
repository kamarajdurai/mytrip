const GEMINI_KEY="AIzaSyDq8yv0a1IhX6C82W2D3KJkCeMaw8kv2Lo";
const WEATHER_KEY="b2c5b477f503ea54bffa1455a210ff49";

document.addEventListener('DOMContentLoaded',()=>{
  setupWeatherAnimations();

  ['#travelTypeOptions', '#budgetOptions', '#placeTypeOptions'].forEach(selector=>{
    document.querySelectorAll(selector+' .option-card').forEach(card=>{
      card.addEventListener('click',()=>{
        document.querySelectorAll(selector+' .option-card').forEach(c=>c.classList.remove('active'));
        card.classList.add('active');
      });
    });
  });
});

function setupWeatherAnimations(){
  if(!document.querySelector('.weather-bg')){
    const bg=document.createElement('div');
    bg.className='weather-bg';
    document.body.appendChild(bg);
  }
}

function setWeatherAnimation(weatherType){
  const oldAnim=document.querySelector('.weather-animation');
  if(oldAnim) oldAnim.remove();
  const anim=document.createElement('div');
  anim.className=`weather-animation ${weatherType}`;
  anim.textContent = weatherType==='rain'?'🌧️':weatherType==='clouds'?'☁️':'☀️';
  document.body.appendChild(anim);

  const bg=document.querySelector('.weather-bg');
  bg.style.background = weatherType==='rain' ? 'linear-gradient(to bottom,#4682B4,#708090)' : weatherType==='clouds' ? 'linear-gradient(to bottom,#B0C4DE,#778899)' : 'linear-gradient(to bottom,#87CEEB,#1E90FF)';
}

function getDaysInRange(start,end){
  const s=new Date(start), e=new Date(end);
  const days=[];
  for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)) days.push(new Date(d));
  return days;
}

async function generatePlan(){
  const city=document.getElementById("cityInput").value.trim();
  const start=document.getElementById("startDate").value;
  const end=document.getElementById("endDate").value;
  const travelType=document.querySelector('#travelTypeOptions .option-card.active').dataset.value;
  const budget=document.querySelector('#budgetOptions .option-card.active').dataset.value;
  const placeType=document.querySelector('#placeTypeOptions .option-card.active').dataset.value;
  const custom=document.getElementById("customPrompt").value.trim();
  const output=document.getElementById("output");
  const downloadBtn=document.getElementById("downloadBtn");
  downloadBtn.style.display="none";
  output.classList.remove("show");

  if(custom) return await sendToGemini(custom,output);
  if(!city) return output.textContent="❗ Enter a city.";
  if(!start||!end) return output.textContent="📅 Select start & end dates.";

  output.textContent="🌦 Fetching weather...";
  output.classList.add("show");

  try{
    const days=getDaysInRange(start,end);
    const weatherRes=await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${WEATHER_KEY}&units=metric`);
    const weatherData=await weatherRes.json();
    if(weatherData.cod!=="200") return output.textContent="⚠️ City not found.";

    const forecastMap=new Map();
    weatherData.list.forEach(e=>{
      const date=e.dt_txt.split(" ")[0];
      if(!forecastMap.has(date)) forecastMap.set(date,e);
    });

    let weatherInfo=`Weather forecast for ${city}:\n\n`;
    let dailySummaries=[];

    days.forEach((d,i)=>{
      const ds=d.toISOString().split("T")[0];
      const f=forecastMap.get(ds);
      if(f){
        const desc=f.weather[0].description, temp=f.main.temp, wt=f.weather[0].main.toLowerCase();
        weatherInfo+=`${d.toDateString()}: ${desc}, ${temp}°C\n`;
        dailySummaries.push({day:i+1,date:d.toDateString(),desc,temp,wt});
        setTimeout(()=>setWeatherAnimation(wt),i*400);
      }else weatherInfo+=`${d.toDateString()}: No data\n`;
    });

    setTimeout(async()=>{
      output.textContent=`${weatherInfo}\n\nGenerating trip plan...`;
      const prompt=`Create a ${days.length}-day Tamil Nadu trip plan for ${city} (${start} to ${end}),
Travel: ${travelType}, Budget: ${budget}, Places: ${placeType}.
Weather: ${dailySummaries.map(d=>`Day ${d.day} (${d.date}): ${d.desc}, ${d.temp}°C`).join('\n')}
Include suggested visit time for each place (morning/afternoon/evening), estimated duration, and order them day-wise.`;

      await sendToGemini(prompt,output,weatherInfo);
    },days.length*400);

  }catch(err){console.error(err); output.textContent="❌ Something went wrong.";}
}

async function sendToGemini(prompt,output,weatherInfo=""){
  try{
    const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,{
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
    });
    const data=await res.json();
    const downloadBtn=document.getElementById("downloadBtn");

    if(data.candidates?.[0]?.content?.parts?.[0]?.text){
      output.textContent=`${weatherInfo}\n\n${data.candidates[0].content.parts[0].text}`;
      output.classList.add("show");
      downloadBtn.style.display="block";
    }else{
      output.textContent=`${weatherInfo}\n\nCould not generate plan.`;
      downloadBtn.style.display="none";
    }
  }catch(e){console.error(e); output.textContent="❌ Failed to contact Gemini API"; downloadBtn.style.display="none";}
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
