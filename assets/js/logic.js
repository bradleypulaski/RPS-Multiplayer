
            // Initialize Firebase
            var config = {
                apiKey: "AIzaSyBzHRNmrJr315bBejWaNMenE26DU0xVQdE",
                authDomain: "rock-paper-cissors.firebaseapp.com",
                databaseURL: "https://rock-paper-cissors.firebaseio.com",
                projectId: "rock-paper-cissors",
                storageBucket: "rock-paper-cissors.appspot.com",
                messagingSenderId: "593793955361"
            };
            firebase.initializeApp(config);
            var database = firebase.database();

            function setUser(name) {
                var user = database.ref('users').push({
                    name: name
                });
                var id = user.key;
                database.ref('users/' + id).set({id: id, name: name});
                localStorage.setItem("user_id", id);
                localStorage.setItem("user_name", name);
            }

            function checkOpenGames() {
                database.ref("games").once("value", function (snapshot) {
                    var result = snapshot.val();
                    if (result == null) {
                        createGame();
                    } else {
                        var opengames = false;
                        for (var key in result) {
                            if (key == "__proto__") { // dont execute logic in protype key
                                continue;
                            }
                            var game = result[key];
                            if (game.users.length > 1) {
                            } else {
                                opengames = true;
                                var users = game.users;
                                users.push({id: localStorage.getItem("user_id"), name: localStorage.getItem("user_name"), move: "none", wins: 0, ties: 0, losses: 0});
                                database.ref('games/' + key + "/users").set(users);
                                localStorage.setItem("game_id", game.id);
                                localStorage.setItem("game_index", "1");
                                getChatByGame(game.id);
                            }
                        }
                        if (!opengames) {
                            createGame();
                        }
                    }
                });
            }

            function getChatByGame(id) {
                database.ref("chat").once("value", function (snapshot) {
                    var chats = snapshot.val();

                    for (var key in chats) {
                        var chat = chats[key];
                        if (chat.game == id) {

                            localStorage.setItem("chat_id", chat.id);
                            var users = chat.users;
                            users.push({id: localStorage.getItem("user_id"), name: localStorage.getItem("user_name"), writing: false})
                            database.ref('chat/' + key + "/users").set(users);

                        }
                    }
                });



            }

            function createGame() {
                var user = localStorage.getItem("user_id");
                var name = localStorage.getItem("user_name");
                var users = [{id: user, name: name, move: "none", wins: 0, ties: 0, losses: 0}];
                var game = database.ref('games').push({
                    users: users
                });
                var id = game.key;
                localStorage.setItem("game_id", id);
                database.ref('games/' + id).set({id: id, users: users});
                var chat = database.ref('chat').push({
                    game: id,
                    users: [{id: user, name: name, writing: false}]
                });
                var cid = chat.key;
                localStorage.setItem("chat_id", cid);
                localStorage.setItem("game_index", "0");
                database.ref('chat/' + cid).set({id: cid, game: id, users: [{id: user, name: name, writing: false}], messages: ""});
            }

            function addChatMessage(message) {
                var chatid = localStorage.getItem("chat_id");
                var name = localStorage.getItem("user_name");



                database.ref('chat/' + chatid + "/messages").push(name + ": " + message);




            }

            function selectMove(move) {
                var gameid = localStorage.getItem("game_id");
                var index = localStorage.getItem("game_index");
                database.ref("games/" + gameid + "/users/" + index + "/move").set(move);

            }

            function writingChat(boolean) {
                var chatid = localStorage.getItem("chat_id");
                var gameid = localStorage.getItem("game_id");
                database.ref("chat/" + chatid).once("value", function (snapshot) {
                    var result = snapshot.val();
                    var users = result.users;
                    var messages = result.messages;
                    for (var key in users) {
                        var user = users[key];
                        if (user.id == localStorage.getItem("user_id")) {
                            users[key].writing = boolean;
                        }
                    }
                    database.ref('chat/' + chatid).set({id: chatid, game: gameid, messages: messages, users: users});
                });
            }

            function isWriting() {
                writingChat(true);
            }
            function isNotWriting() {
                writingChat(false);
            }

//            TODO LISTENER TO UPDATE CHAT, listener to have typing notification gif in chat, listener to check moves
            function messageListener() {
                                                    var chatid = localStorage.getItem("chat_id");

                database.ref("chat/" + chatid + "/messages").on("value", function (snapshot) {

                    var result = snapshot.val();
                    $("#message-container").html("");
                    for (var key in result) {
                        var m = result[key];
                        $("#message-container").append("<p class='message'>" + m + "</p>");
                        $("#message-container").scrollTop($("#message-container")[0].scrollHeight); // scroll to bottom each time message is added
                    }
                });
            }
            function writingListener() {
                                                var chatid = localStorage.getItem("chat_id");

                database.ref("chat/" + chatid + "/users").on("value", function (snapshot) {

                    var result = snapshot.val();
                    var writing = false;
                    for (var key in result) {
                        var user = result[key];
                        if (user.id !== localStorage.getItem("user_id") && user.writing === true) {
                            $("#writing").html(user.name + " is typing...");
                            writing = true
                        } else {

                        }
                    }
                    if (!writing) {
                        $("#writing").html("");
                    }
                });
            }

            function moveListener() {
                          var gameid = localStorage.getItem("game_id");
                var gindex = localStorage.getItem("game_index");
                var eindex = "0";
                if (gindex == '0') {
                    eindex = "1";
                }
                database.ref("games/" + gameid + "/users").on("value", function (snapshot) {
                    
          
                    
                    var result = snapshot.val();


                    var move = "none";
                    var enemymove = "none";
                    var enemyname = "none";
                    var index = 0;
                    var enemyindex = 1;
                    for (var key in result) {
                        var user = result[key];
                        if (user.id == localStorage.getItem("user_id")) {
                            move = user.move;
                            index = key;
                        } else {
                            enemymove = user.move;
                            enemyname = user.name;
                            enemyindex = key;
                        }
                    }
                    if (index === '0') {
                        if (move !== "none" && enemymove !== "none") {

                            if (move == enemymove) {
                                result[index].ties++;
                                result[enemyindex].ties++;

                            }
                            if (move == "rock" && enemymove == "scissor") {
                                result[index].wins++;
                                result[enemyindex].losses++;
                            }
                            if (move == "rock" && enemymove == "paper") {
                                result[index].losses++;
                                result[enemyindex].wins++;

                            }
                            if (move == "scissor" && enemymove == "paper") {
                                result[index].wins++;
                                result[enemyindex].losses++;

                            }
                            if (move == "scissor" && enemymove == "rock") {
                                result[index].losses++;
                                result[enemyindex].wins++;

                            }
                            if (move == "paper" && enemymove == "rock") {
                                result[index].wins++;
                                result[enemyindex].losses++;

                            }
                            if (move == "paper" && enemymove == "scissor") {
                                result[index].losses++;
                                result[enemyindex].wins++;

                            }

                            result[index].move = "none";
                            result[enemyindex].move = "none";
                        }
                        database.ref("games/" + gameid + "/users").set(result);
                    }
                    if (move !== "none" && enemymove !== "none") {
                        var status = "";
                        if (move == enemymove) {
                            status = "Tied";

                        }
                        if (move == "rock" && enemymove == "scissor") {
                            status = "Won";
                        }
                        if (move == "rock" && enemymove == "paper") {
                            status = "Lossed";

                        }
                        if (move == "scissor" && enemymove == "paper") {
                            status = "Won";

                        }
                        if (move == "scissor" && enemymove == "rock") {
                            status = "Lossed";

                        }
                        if (move == "paper" && enemymove == "rock") {
                            status = "Won";

                        }
                        if (move == "paper" && enemymove == "scissor") {
                            status = "Lossed";

                        }
                        $("#currentmoves").html("<p>You chose " + move + ", " + enemyname + " chose " + enemymove + ". You " + status + "</p>");
                    }
                    var wins = result[gindex].wins;
                    var ewins = result[eindex].wins;
                    var losses = result[gindex].losses;
                    var elosses = result[eindex].losses;
                    var ties = result[gindex].ties;


                    $("#wins").html(wins);
                    $("#losses").html(losses);
                    $("#ties").html(ties);
                });
            }

            function reset() {

                database.ref('games/' + localStorage.getItem("game_id")).remove();
                database.ref('chat/' + localStorage.getItem("chat_id")).remove();
                database.ref('users/' + localStorage.getItem("user_id")).remove();

                localStorage.clear();
                location.reload();
            }

          

            $(function () {

                if (localStorage.getItem("user_id") !== null) {
                    $("#start-overlay").css("display", "none");
                    setTimeout(function () {
                        messageListener();
                        writingListener();
                        moveListener();
                    }, 3000);
                }

                $("#start-game").click(function (e) {
                    var name = $("#name").val();
                    setUser(name);
                    checkOpenGames();
                    setTimeout(function () {
                        messageListener();
                        writingListener();
                        moveListener();
                    }, 3000);
                    $("#start-overlay").css("display", "none");
                });


                $("#chat-submit").click(function () {
                    var message = $("#chatbox").val();
                    addChatMessage(message);
                    $("#chatbox").val("");
                    isNotWriting();
                });
                $("#chatbox").change(function () {
                    isWriting();
                });
                $(".move").click(function () {
                    var move = $(this).attr("data-move");
                    selectMove(move);
                });
                $("#reset").click(function () {
                    reset();
                });
              


            });


            $(document).keypress(function (e) {
                if (e.which == 13) { // if enter key pressed and message content add message
                    if ($("#chatbox").val()) {
                        var message = $("#chatbox").val();
                        addChatMessage(message);
                        $("#chatbox").val("");
                        isNotWriting();
                    }
                }
            });


 