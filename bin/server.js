var http = require('http');
var express = require('express');
var WebSocket = require('ws');
var url = require('url');
var app = require('../app');
var server = http.createServer(app);

var wss= new WebSocket.Server({
    server
});
//保存socket
function UserSession() {
    this.users = {};
}
UserSession.prototype.remove = function (name) {
    delete users[name];
}

UserSession.prototype.setUserInfo = function (name, info) {
    this.users[name] = info;
}

UserSession.prototype.getUserInfo = function (name) {
    return this.users[name];
}

UserSession.prototype.sendMsg = function (name, msg) {
    var users = this.users;
    try {
        console.log(users[name])
        if (users[name].ws) {
            users[name].ws.send(JSON.stringify(msg));
            return;
        }
    } catch (error) {
        console.log(error);
    }

}
var usersession = new UserSession();
users = {};
wss.on('connection',
    function(connection) {
        console.log("User connected");

        connection.on('message',
            function(message) {
                var data;
                try {
                    data = JSON.parse(message);
                } catch(e) {
                    console.log("Error parsing JSON");
                    data = {};
                }
                switch (data.type) {
                    case "login":
                        console.log("User logged in as", data.name);
                        if (users[data.name]) {
                            sendTo(connection, {
                                type: "login",
                                success: false
                            });
                        } else {
                            users[data.name] = connection;
                            connection.name = data.name;
                            sendTo(connection, {
                                type: "login",
                                success: true
                            });
                        }
                        break;

                    case "offer":
                        console.log("Sending offer to", data.name);
                        var conn = users[data.name];
                        if (conn != null) {
                            connection.otherName = data.name;
                            sendTo(conn, {
                                type: "offer",
                                offer: data.offer,
                                name: connection.name
                            });
                        }
                        break;

                    case "answer":
                        console.log("Sending answer to", data.name);
                        var conn = users[data.name];
                        if (conn != null) {
                            connection.otherName = data.name;
                            sendTo(conn, {
                                type: "answer",
                                answer: data.answer
                            });
                        }
                        break;

                    case "candidate":
                        console.log("Sending candidate to", data.name);
                        var conn = users[data.name];
                        if (conn != null) {
                            sendTo(conn, {
                                type: "candidate",
                                candidate: data.candidate
                            });
                        }
                        break;

                    case "leave":
                        console.log("Disconnecting user from", data.name);
                        var conn = users[data.name];
                        conn.otherName = null;
                        if (conn != null) {
                            sendTo(conn, {
                                type: "leave"
                            });
                        }
                        break;

                    default:
                        sendTo(connection, {
                            type: "error",
                            message: "Unrecognized command:" + data.type
                        });
                        break;
                }
            });

        function sendTo(conn, message) {
            conn.send(JSON.stringify(message));
        }

        connection.on('close',
            function() {
                if (connection.name) {
                    delete users[connection.name];
                    if (connection.otherName) {
                        console.log("Disconnecting user from", connection.otherName);
                        var conn = users[connection.otherName];
                        conn.otherName = null;
                        if (conn != null) {
                            sendTo(conn, {
                                type: "leave"
                            });
                        }
                    }
                }

            });

        connection.send('{"hello":"hello123"}');
    });

wss.on('listening',
    function() {
        console.log("Server started...");
    });

server.listen(3002, function () {
    console.log('服务器开启：' + 3002);
})