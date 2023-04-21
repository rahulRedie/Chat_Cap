const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const http = require("http");
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
const cryptography = require("./cryptography");

server.listen(process.env.PORT || PORT, () => console.log("running on port 3001"));
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: "*:3000", //if you change your frontend url enter it here
        credentials: true,
    },
});

io.on("connection", (socket) => {
    //console.log("a user connected");

    socket.on("updateMessages", (message) => {
        deMsg = cryptography.decrypt(message.data);
        chatId = deMsg.chat;
        //console.log("sended message: ");
        ////console.log(message);
        socket.to("C" + chatId).emit("receive-message", message);
    });

    socket.on("join-room", (room) => {
        // [...socket.rooms].map((r) => socket.leave(r));
        // if (socket.rooms.size > 1)
        //     socket.leave([...socket.rooms][socket.rooms.size - 1]);
        [
            ...[...socket.rooms].filter((element) => element.startsWith("C")),
        ].forEach((element) => socket.leave(element));

        socket.join("C" + room);
        //console.log("rooms ", socket.rooms);
    });
    socket.on("get-rooms", () => {
        socket.emit("print", socket.rooms);
    });

    socket.on("join-notification-room", (chat_id) => {
        let roomStr = "N" + chat_id;
        socket.join(roomStr);
    });

    socket.on("notify-chat", (chat_id) => {
        let roomStr = "N" + chat_id;
        socket.to(roomStr).emit("trigger-notification", chat_id);
    });
});
//add relevant details below
const db = mysql.createConnection({
    user: process.env.USER, // write your mysql user here
    host: process.env.HOST, //write your host name here
    password: process.env.PASSWORD, //write your password here
    database: process.env.DATABASE, //write your database name here
});
// const db = mysql.createConnection(
//     "mysql://root:VyFy1UKkIhNNnhKGRZ7N@containers-us-west-74.railway.app:6086/railway"
// );
app.post("/addUser", (req, res) => {
    //console.log("got post request to /addUser");
    const username = req.body.username;
    const password = req.body.password;

    db.query(
        "INSERT INTO users (username,password) VALUES (?,?)",
        [username, password],
        (err, result) => {
            if (err) {
                res.send("failure");
            } else {
                res.send("success");
            }
        }
    );
});

app.get("/countByUserName", (req, res) => {
    const username = req.query.username;
    //console.log(username);
    db.query(
        "SELECT COUNT(username) AS nameCount FROM users WHERE username=?",
        [username],
        (err, result) => {
            if (err) {
                //console.log(err);
            } else {
                res.send(result);
            }
        }
    );
});

app.get("/verifyLogin", (req, res) => {
    const username = req.query.username;
    const password = req.query.password;
    db.query(
        "SELECT id,password FROM users WHERE username=?",
        [username],
        (err, result) => {
            if (err) {
                //console.log(err);
            } else {
                if (password === result[0].password) {
                    res.send(String(result[0].id));
                } else {
                    res.send("failure");
                }
                //console.log(result[0].password);
            }
        }
    );
});
function insertChat(user1, user2, res) {
    if (user1 === user2) res.send("failure");
    db.query(
        "INSERT INTO chat (user1_id,user2_id) VALUES (?,?)",
        [user1, user2],
        (err2, result2) => {
            if (err2) {
                res.send("failure");
            } else {
                res.send("success");
            }
        }
    );
}
app.post("/addChat", (req, res) => {
    const user1 = req.body.user1;
    const user2 = req.body.user2;
    //console.log(`chat created between ${user1} and ${user2}`);
    const sqlQuery =
        "SELECT COUNT(id) AS ChatCount FROM chat WHERE (user1_id=? AND user2_id=?) OR  (user1_id=? AND user2_id=?)";
    db.query(sqlQuery, [user1, user2, user2, user1], (err, result) => {
        if (err) {
            //console.log(err);
        } else {
            result[0].ChatCount === 0
                ? insertChat(user1, user2, res)
                : res.send("chat already exist");
        }
    });
});

app.get("/allChats", (req, res) => {
    const user = req.query.user;
    db.query(
        "select c.id as chat_id, u.username as otherUser\
        from chat c \
        join users u on u.id=c.user2_id \
        where c.user1_id=? \
        union\
        select c.id as chat_id, u.username as otherUser \
        from chat c \
        join users u on u.id=c.user1_id \
        where c.user2_id=? \
        Order by chat_id",
        [user, user],
        (err, result) => {
            if (err) {
                //console.log(err);
                res.send("err");
            } else {
                //console.log(result);
                res.send({ result });
            }
        }
    );
});
app.get("/getId", (req, res) => {
    const username = req.query.username;
    //console.log(username);
    db.query(
        "SELECT id FROM users WHERE username=?",
        [username],
        (err, result) => {
            if (err) {
                //console.log(err);
                res.send("error");
            } else {
                if (result[0] != undefined) {
                    //console.log("getId result");
                    //console.log(result[0]);
                    res.send(String(result[0].id));
                } else {
                    res.send("no results");
                }
            }
        }
    );
});

app.get("/getUname", (req, res) => {
    const id = req.query.id;
    db.query("SELECT username FROM users WHERE id=?", [id], (err, result) => {
        if (err) {
            //console.log(err);
        } else {
            res.send(String(result[0].username));
        }
    });
});
app.get("/chatDetails", (req, res) => {
    const chatId = req.query.id;
    db.query(
        "SELECT content,sender_id,receiver_id,timeSt FROM message WHERE chat_id=?",
        [chatId],
        (err, result) => {
            res.send(result);
        }
    );
});
app.get("/usersInChat", (req, res) => {
    const chatId = req.query.chat_id;
    db.query(
        "SELECT user1_id,user2_id From chat WHERE id=?",
        [chatId],
        (err, result) => {
            res.send(result[0]);
        }
    );
});
app.post("/sendMessage", (req, res) => {
    encryptedMSG = req.body.data;
    const msg = cryptography.decrypt(encryptedMSG);
    const chat = msg.chat;
    const sender = msg.sender;
    const receiver = msg.receiver;
    const content = msg.content;
    const timeSt = msg.timeSt;
    db.query(
        "INSERT INTO message (sender_id, receiver_id, content,  chat_id, timeSt) VALUES (?,?,?,?,?)",
        [sender, receiver, content, chat, timeSt],
        (err, result) => {
            if (err) console.log(err);
            else {
                //console.log("message sent");
                res.send("success");
            }
        }
    );
});
