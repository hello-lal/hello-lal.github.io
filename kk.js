// ���������
if (!location.hash) {
    location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
// ��ȡ�����
var roomHash = location.hash.substring(1);
 
// �������Լ���Ƶ��id, ������ע����ScaleDrone �����󣬴�����channel
// ��Ҳ�����Լ�����
var drone = new ScaleDrone('87fYv4ncOoa0Cjne');
// ������������ 'observable-'��ͷ
var roomName = 'observable-' + roomHash;
var configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302' // ʹ�ùȸ��stun����
    }]
};
 
var room;
var pc;
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

function onSuccess() {}
 
function onError(error) {
    console.error(error);
}
 
drone.on('open', function(error){
    if (error) { return console.error(error);}
 
    room = drone.subscribe(roomName);
    room.on('open', function(error){
        if (error) {onError(error);}
    });
 
    // �Ѿ����ӵ�����󣬾ͻ��յ�һ�� members ���飬��������ĳ�Ա
    // ��ʱ����������Ѿ�����
    room.on('members', function(members){
        console.log('MEMBERS', members);
 
        // ������ǵڶ������ӵ�������ˣ��ͻᴴ��offer
        var isOfferer = members.length === 2;
        startWebRTC(isOfferer);
    });
});
 
// ͨ��Scaledrone����������Ϣ
function sendMessage(message) {
    drone.publish({
        room: roomName,
        message
    });
}
 
function startWebRTC(isOfferer) {
    pc = new RTCPeerConnection(configuration);
 
    // ������ICE Agent��Ҫͨ���źŷ�����������Ϣ��������ʱ
    // �ᴥ��icecandidate�¼��ص�
    pc.onicecandidate = function(event){
        if (event.candidate) {
            sendMessage({ 'candidate': event.candidate });
        }
    };
 
    // ����û��ǵڶ���������ˣ�����negotiationneeded �¼��󴴽�sdp
    if (isOfferer) {
        // onnegotiationneeded ��Ҫ��sesssionЭ��ʱ����
        pc.onnegotiationneeded = function() {
            // ��������sdp���� SDP (Session Description Protocol) session����Э��
            pc.createOffer().then(localDescCreated).catch(onError);
        };
    }
 
    // ��Զ������������ʱ����������װ�ص�video��
    pc.onaddstream = function(event){
        remoteVideo.srcObject = event.stream;
    };
 
    // ��ȡ����ý����
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    }).then( function(stream) {
        // �����ز������Ƶ��װ�ص�����video��
        localVideo.srcObject = stream;
 
        // ������������RTCPeerConnection ʵ���� ���͵�������
        pc.addStream(stream);
    }, onError);
 
    // ��Scaledrone������������
    room.on('data', function(message, client){
        // ��Ϣ�����Լ����͵ģ��򲻴���
        if (client.id === drone.clientId) {
            return;
        }
 
        if (message.sdp) {
            // ����Զ��sdp, ��offer ���� answer��
            pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function(){
                // ���յ�offer ��ͽ���
                if (pc.remoteDescription.type === 'offer') {
                    pc.createAnswer().then(localDescCreated).catch(onError);
                }
            }, onError);
        }
        else if (message.candidate) {
            // �����µ� ICE canidatet �����ص�������
            pc.addIceCandidate(
                new RTCIceCandidate(message.candidate), onSuccess, onError
            );
        }
    });
}
 
function localDescCreated(desc) {
    pc.setLocalDescription(desc, function(){
        sendMessage({ 'sdp': pc.localDescription });
    },onError);
}