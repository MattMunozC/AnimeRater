import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
  
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-analytics.js";

import { getDatabase,onValue, ref, set, get,child} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js"


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
    name_div.innerText=name
    pic.src=profile
    new_user.appendChild(pic)
    new_user.appendChild(name_div)
    new_user.appendChild(score)
    panel.appendChild(new_user)
}
var username;
var current_video;
var current_video_nickname;
var video_player=document.getElementById("op-ed-player")
get(ref(db,"/status")).then((snapshot)=>{
    if(snapshot.val()!==null){
        current_video=snapshot.val().current_video
        video_player.src=current_video;
        
    }
})

onValue(ref(db,"/status/current_video"),(snapshot)=>{
    if(snapshot.val()!==null){
        current_video=snapshot.val()
        video_player.src=current_video;
        let video=current_video.split(".")
        video=video[video.length-2].split("/")
        video=video[video.length-1]
        current_video_nickname=video;
    }
})


let score=document.getElementById("score");
score.addEventListener("keydown",(event)=>{
    if(event.key=='Enter'){
        let score_value=parseFloat(event.originalTarget.value)
        if(score_value<=10.0 && current_video!==undefined && username!==undefined){
            let reference=ref(db,`/score/${current_video_nickname}/${username}`);
            get(reference).then((snapshot)=>{
                if(snapshot.val()===null){
                    set(reference,score_value)
                }
            })
            onValue(ref(db,`/score/${video}`),(snapshot)=>{
                console.log(snapshot.val())
                if(snapshot.val()!==null){
                    let users=snapshot.val()
                    for(let [key, value] of Object.entries(users)){
                        document.getElementById(key).innerText=value
                    }
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
    get(ref(db,"/status/total_player")).then((snapshot)=>{
        if(snapshot.val()!==null){
            get(ref(db,"/participant/")).then((participant)=>{
                let obj=participant.val()
                if(!Object.keys(obj).includes(username)){
                    set(ref(db,"/status/total_player"),snapshot.val()+1)
                    set(reference,{
                        "profile_pic":profile.value}
                    )
                }
            })
            
        }else{
            set(ref(db,"/status/total_player"),1)
            set(reference,{
                "profile_pic":profile.value}
            )
            set(ref(db,"/status/leader"),username);
        }
        
    })
    set(ref(db,`/status/start/${username}`),false)
        

})


//CHECK ON PARTICIPANTS
onValue(ref(db, `/participant/`),(snapshot)=>{
    let users=snapshot.val()
    if (users!==null){
        document.getElementById("user_panel").innerHTML="";
        for(let [key, value] of Object.entries(users)){
            add_user(key,value.profile_pic)
        }
    }

})


//CHECK ON SCORES
onValue(ref(db,"/score"),(snapshot)=>{
    if(current_video && snapshot.val()!==null){
        let scores=snapshot.val()[current_video_nickname]
        for(let [key, value] of Object.entries(scores)){
            let user=document.getElementById(key)
            user.innerText=value
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
                        if(username){
                            if(snapshot.val()===null){
                                set(reference,[event.originalTarget.attributes.link.nodeValue])
                            }
                            else{
                                let queue=snapshot.val()
                                queue.push(event.originalTarget.attributes.link.nodeValue)
                                set(reference,queue)
                            }
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
    if (controller!==null){
        if(controller.pause){
            video_player.pause()
        }else{
            video_player.play()
        }
    }

})

function AND_gate(list){
    for(let element of list){
        console.log(element)
        if(element!=true){
            return false;
        }
    }
    return true;
}

let start=document.getElementById("start")
start.addEventListener("click",()=>{
    let reference=ref(db,`/status/start/${username}`)
    set(reference,true)
    onValue(ref(db,'/status/start'),(snapshot)=>{
        let obj=snapshot.val()
        let values=Object.values(obj)
        get(ref(db,'/status/total_player/')).then((total_player)=>{
            console.log("aqui owo")
            console.log(AND_gate(values))
            console.log(values.length)
            console.log(total_player.val())
            console.log(total_player.val())
            if(AND_gate(values) && values.length==total_player.val() && total_player.val()>1){
                console.log("aqui")
                get(ref(db,"/status/leader")).then((leader)=>{
                    get(ref(db,"/queue")).then((queue)=>{
                        if(username==leader.val()){
                            if (queue.val()!==null){
                                let new_queue=queue.val();
                                console.log(queue)
                                set(ref(db,"/status/current_video"),new_queue[0])
                                new_queue.shift();
                                set(ref(db,"/queue"),new_queue)
                                set(ref(db,"/controller/pause"),false);
                            }

                        }
                    })

                })
            }
        })
        
       
    })
})

onValue(ref(db,"/status/start_player"),(snapshot)=>{
    if(snapshot.val()!==null){
        if(snapshot.val()){
            video_player.play()
        }
    }
})

let queue_see=document.getElementById("see-queue")
queue_see.addEventListener("click",()=>{
    document.getElementById("queue-wrapper").style=""
    let queue_list=document.getElementById("queue")
    get(ref(db,"/queue")).then((snapshot)=>{
        if(snapshot.val()!==null){
            queue_list.innerHTML=""
            for(let element of snapshot.val()){
                let new_div=document.createElement("div")
                new_div.innerText=element;
                new_div.className="queue-element";
                queue_list.appendChild(new_div);
            }
        }
    })
})

let queue_button=document.getElementById("close-queue");
queue_button.addEventListener("click",()=>{
    document.getElementById('queue-wrapper').style='display:none;'
})

let next=document.getElementById("next")
next.addEventListener("click",()=>{
    set(ref(db,`/status/next/${username}`),true)
    get(ref(db,'/status/leader')).then((snapshot)=>{
        if(snapshot.val()!==null){
            if(snapshot.val()==username){
                get(ref(db,'/queue')).then((queue)=>{
                    if (queue.val()!==null){
                        let new_queue=queue.val();
                        console.log(queue)
                        set(ref(db,"/status/current_video"),new_queue[0])
                        new_queue.shift();
                        set(ref(db,"/queue"),new_queue)
                        set(ref(db,"/status/start_player"),true);
                    }
                })

            }
        }
    })
})