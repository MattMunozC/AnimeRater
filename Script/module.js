import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

import { getDatabase,onValue, ref, set, get,child} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js"

function fileToBinary(arrayBuffer) {
    const byteArray = new Uint8Array(arrayBuffer);
    let binaryContent = '';
    for (let i = 0; i < byteArray.length; i++) {
        binaryContent += byteArray[i].toString(2).padStart(8, '0') + ' ';
    }
    return binaryContent;
}

const firebaseConfig = {

    apiKey: "AIzaSyCNSqypCzgDOCzBSgoKfECKkz7eWhXYgzU",

    authDomain: "guess-who-pkmn.firebaseapp.com",

    databaseURL: "https://guess-who-pkmn-default-rtdb.firebaseio.com",

    projectId: "guess-who-pkmn",

    storageBucket: "guess-who-pkmn.appspot.com",

    messagingSenderId: "517701876804",

    appId: "1:517701876804:web:d362bfeb86877948ac9011",

    measurementId: "G-EQTS6RT37T"

  };


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);

const db=getDatabase();

function add_user(name,profile,score_value=0){
    let panel=document.getElementById("user_panel");
    let new_user=document.createElement("div")
    let pic=document.createElement("img")
    let name_div=document.createElement("div")
    let score=document.createElement("div")
    score.innerHTML=`<div class='score'>Nota: </div><div class='score_board' id='${name}'>${score_value}</div>`
    new_user.className="user_position"
    new_user.id=username
    name_div.innerText=name
    pic.src=profile
    new_user.appendChild(pic)
    new_user.appendChild(name_div)
    new_user.appendChild(score)
    panel.appendChild(new_user)
}
var username;
var current_video="https://v.animethemes.moe/InuYasha-ED5.webm";

let score=document.getElementById("score");
score.addEventListener("keydown",(event)=>{
    if(event.key=='Enter'){
        let score_value=parseFloat(event.originalTarget.value)
        if(score_value<=10.0 && current_video!==undefined && username!==undefined){
            let video=current_video.split(".")
            video=video[video.length-2].split("/")
            video=video[video.length-1]
            let reference=ref(db,`/score/"${video}"/${username}`);
            get(reference).then((snapshot)=>{
                if(snapshot.val()===null){
                    set(reference,score_value)
                }
            })
            let my_score=document.getElementById(username)
            my_score.innerText=score_value
            switch (true){
                case score_value>=8.0:
                    my_score.style="color:green";
                    break;
                case score_value<=4.0:
                    my_score.style="color:red";
                    break;
                default:
                    my_score.style="color:white";
                    break;
            }

        }

    }
})


let submit=document.getElementById("submit")

submit.addEventListener("click",(event)=>{
    let name=document.getElementById("username");
    let profile=document.getElementById("profile_pic");
    username=name.value;
    document.getElementById("enter").style="display:none"
    let reference=ref(db, `/participant/${username}`);
    
    set(reference,{
        "profile_pic":profile.value}
    )
})


onValue(ref(db, `/participant/`),(snapshot)=>{
    let users=snapshot.val()
    if (users!==null){
        document.getElementById("user_panel").innerHTML="";
        for(let [key, value] of Object.entries(users)){
            
            add_user(key,value.profile_pic)
        }
    }

})

for(let i=1;i<176;i++){
    let new_number=document.createElement("div")
    new_number.innerText=i
    new_number.addEventListener("click",()=>{
        
        getElements(`https://api.animethemes.moe/video?page%5Bsize%5D=100&page%5Bnumber%5D=${i}`)
    })
    document.getElementById("selector").appendChild(new_number)
}

function getElements(url){
    fetch(url)
        .then(response => {
            // Check if the request was successful
            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            // Parse the response as JSON
            return response.json();
        })
        .then(data => {   
            let list=document.getElementById("list")
            list.innerHTML=""
            for(let anime of data.videos){
                let div=document.createElement("div")
                div.innerText=anime.filename
                div.setAttribute("link",anime.link)
                div.addEventListener("click",(event)=>{
                    let reference=ref(db,"/queue")
                    get(reference).then((snapshot)=>{
                        if(snapshot.val()===null){
                            set(reference,[event.originalTarget.attributes.link.nodeValue])
                        }
                        else{
                            let queue=snapshot.val()
                            queue.push(event.originalTarget.attributes.link.nodeValue)
                            set(reference,queue)
                        }

                    })

                })
                list.appendChild(div)
            }
        })
        .catch(error => {
            // Handle errors
            console.error('There was a problem with the fetch operation:', error);
    });
}
getElements("https://api.animethemes.moe/video?page[size]=100")

let pause=document.getElementById("pause")
pause.addEventListener("click",()=>{
    let reference=ref(db,"/controller/pause")
    get(reference).then((snapshot)=>{
        set(reference,!snapshot.val())
    })
})

onValue(ref(db, `/controller/`),(snapshot)=>{
    let controller=snapshot.val()
    let video=document.getElementById("op-ed-player")
    if (controller!==null){
        console.log(controller.pause)
        if(controller.pause){
            console.log(video)
            video.pause()
            console.log("aqui")
        }
    }

})