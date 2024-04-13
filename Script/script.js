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
