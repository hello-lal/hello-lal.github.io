
var connection = new WebSocket('https://hello-lal.github.io/views/webrtc'),
    name = "";
var loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    callPage = document.querySelector('#call-page'),
    theirUsernameInput = document.querySelector('#their-username'),
    callButton = document.querySelector('#call'),
    hangUpButton = document.querySelector('#hang-up');
callPage.style.display = "none";
// Login when the user clicks the button
loginButton.addEventListener("click",
    function(event) {
        name = usernameInput.value;
        if (name.length > 0) {
            send({
                type: "login",
                name: name
            });
        }
        else
        {
            alert("please input Username!");
        }
    });
connection.onopen = function() {
    console.log("Connected");
};
// Handle all messages through this callback
connection.onmessage = function(message) {
    //alert(JSON.stringify(message.data));
    console.log("Got message", message.data);
    var data = JSON.parse(message.data);
    switch (data.type) {
        case "login":
            onLogin(data.success);
            break;
        case "offer":
            onOffer(data.offer, data.name);
            break;
        case "answer":
            onAnswer(data.answer);
            break;
        case "candidate":
            onCandidate(data.candidate);
            break;
        case "leave":
            onLeave();
            break;
        default:
            break;
    }
};
connection.onerror = function(err) {
    console.log("Got error", err);
};
// Alias for sending messages in JSON format
function send(message) {
    if (connectedUser) {
        message.name = connectedUser;
    }
    connection.send(JSON.stringify(message));
};
function onLogin(success) {
    if (success === false) {
        alert("Login unsuccessful, please try a different name.");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";
        // Get the plumbing ready for a call
        startConnection();
    }
};
callButton.addEventListener("click",
    function() {
        var theirUsername = theirUsernameInput.value;
        if (theirUsername.length > 0) {
            startPeerConnection(theirUsername);
        }
    });
hangUpButton.addEventListener("click",
    function() {
        send({
            type: "leave"
        });
        onLeave();
    });
function onOffer(offer, name) {
    connectedUser = name;
    yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
    yourConnection.createAnswer(function(answer) {
            yourConnection.setLocalDescription(answer);
            send({
                type: "answer",
                answer: answer
            });
        },
        function(error) {
            alert("An error has occurred");
        });
}
function onAnswer(answer) {
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
}
function onCandidate(candidate) {
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
function onLeave() {
    connectedUser = null;
    theirVideo.src = null;
    yourConnection.close();
    yourConnection.onicecandidate = null;
    yourConnection.onaddstream = null;
    setupPeerConnection(stream);
}

function canGetUserMediaUse() {
    return !!(navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

console.log(canGetUserMediaUse());
var bol = false;
var canvas = document.getElementById('canvas');
var video = document.getElementById('video');
var downloadBtn = document.getElementById('downloadBtn');

function getUserMedia(constrains,success,error){
    if(navigator.mediaDevices.getUserMedia){
        //最新标准API
        promise = navigator.mediaDevices.getUserMedia(constrains).then(success).catch(error);
    } else if (navigator.webkitGetUserMedia){
        //webkit内核浏览器
        promise = navigator.webkitGetUserMedia(constrains).then(success).catch(error);
    } else if (navigator.mozGetUserMedia){
        //Firefox浏览器
        promise = navagator.mozGetUserMedia(constrains).then(success).catch(error);
    } else if (navigator.getUserMedia){
        //旧版API
        promise = navigator.getUserMedia(constrains).then(success).catch(error);
    }
}

function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return !! window.RTCPeerConnection;
}
var yourVideo = document.querySelector('#yours'),
    theirVideo = document.querySelector('#theirs'),
    yourConnection,
    connectedUser,
    stream;
function startConnection() {
    if (canGetUserMediaUse()) {
        getUserMedia({
                video: true,
                audio: true
            },
            function(myStream) {
                stream = myStream;
                yourVideo.srcObject = stream;
                if (hasRTCPeerConnection()) {
                    setupPeerConnection(stream);
                } else {
                    alert("Sorry, your browser does not support WebRTC.");
                }
            },
            function(error) {
                console.log(error);
            });
    } else {
        alert("Sorry, your browser does not support WebRTC.");
    }
}
function setupPeerConnection(stream) {

    var configuration = {
        "iceServers": [{
            "url": "stun:stun.1.google.com:19302"
        }]
    };
    yourConnection = new RTCPeerConnection(configuration);
    // Setup stream listening
    yourConnection.addStream(stream);
    yourConnection.onaddstream = function(e) {
        theirVideo.srcObject = e.stream;
    };
    // Setup ice handling
    yourConnection.onicecandidate = function(event) {
        if (event.candidate) {
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    }
}
function startPeerConnection(user) {
    connectedUser = user;
    // Begin the offer
    yourConnection.createOffer(function(offer) {
            send({
                type: "offer",
                offer: offer
            });
            yourConnection.setLocalDescription(offer);
        },
        function(error) {
            alert("An error has occurred.");
        });
};
function showVideo() {
    if (canGetUserMediaUse()) {
        getUserMedia({
            video:true,
            audio:false
        },function (stream) {
            mediaStream = stream;
            const video = document.getElementById('video');
            video.srcObject = stream;
            video.play();
        },function (error) {   console.log("访问用户媒体设备失败：",error.name,error.message);      })
    }else  { alert('您的浏览器不兼容');  }
}
function capture() {
    if (promise) {
        const photo = document.getElementById('photo');
        const theirs = document.getElementById('theirs');
        photo.width = theirs.clientWidth;
        photo.height = theirs.clientHeight;
        var context = photo.getContext('2d');
        context.drawImage(theirs, 0, 0);
    }else{
        alert('请先打开摄像头');
    }
}

var filters = ['', 'grayscale', 'sepia', 'invert','hue-rotate','blur','opacity'],
    currentFilter = 0;
function changeFilter() {
    currentFilter++;
    if (currentFilter > filters.length - 1) currentFilter = 0;
    photo.className = filters[currentFilter];
}

function toImg() {
    var src = photo.toDataURL("image/png");
    downloadBtn.href = src;
    downloadBtn.download = new Date().toLocaleTimeString()
}




var recordBtn= document.getElementById( 'recordBtn' );
var downloadBtn1 = document . getElementById( ' downloadBtn1' );
var recordPlayer = document . getElementById( ' recordPlayer' );
var buffer;
var mediaRecoder;
recordBtn.onclick = function() {
    if (promise) {
        if (recordBtn.textContent === '开始录制') {
            startRecord();
            recordBtn.textContent = '停止录制';
        } else if (recordBtn.textContent === '停止录制') {
            stopRecord();
            recordBtn.textContent = '开始录制';
            downloadBtn.removeAttribute('disabled');
        } else {
            alert("请打开摄像头! ! ! ")
        }
    }
}
function startRecord(){
    buffer=[];
    mediaRecoder = new MediaRecorder(mediaStream);
    mediaRecoder.ondataavailable = function (e) {
        if (e && e.data && e.data.size > 0) {
            buffer.push(e.data);
        }
    }
    mediaRecoder.start(10);
}
function stopRecord() {
    mediaRecoder.stop();
    var blob = new Blob(buffer, {type: 'video/mp4 '});
    console.log(blob);
    //根据缓存数据生成ur1给recordPlayer进行播放
    recordPlayer.src = window.URL.create0bjectUR(blob);
    recordPlayer.srcobject = null;
    recordPlayer.controls = true; // 显示播放控件
}
downloadBtn1.onclick = function() {
    var blob = new Blob(buffer, {type: 'video/mp4'});//根据缓存数据生成url
    var url = window.URL.createObjectURL(blob); //创建一个a标签，通过a标签指向url来下载
    var a = document.createElement('a');
    a.href = url;
    a.style.display = 'none'; //不 显示a标签
    a.download = new Date().toLocaleTimestring();
    a.click();//调用a标签的点击事件进行下载
}