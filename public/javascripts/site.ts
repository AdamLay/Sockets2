//#region Prototypes

declare var Notification: any;

//#endregion

class Settings
{
	// #region Username
	public static _username;

	public static get Username(): string
	{
		if (!Settings._username)
			Settings._username = localStorage["Settings.Username"];

		return Settings._username;
	}

	public static set Username(name: string)
	{
		Settings._username = name;

		if (name == null)
			delete localStorage["Settings.Username"];
		else
			localStorage["Settings.Username"] = Settings._username;
	}
	// #endregion

	// #region Colour
	public static _colour;

	public static get Colour(): string
	{
		if (!Settings._colour)
			Settings._colour = localStorage["Settings.Colour"];

		return Settings._colour;
	}

	public static set Colour(colour: string)
	{
		Settings._colour = colour;

		localStorage["Settings.Colour"] = Settings._colour;
	}
	// #endregion

	// #region Status
	public static _status;

	public static get Status(): string
	{
		if (!Settings._status)
			Settings._status = localStorage["Settings.Status"];

		return Settings._status;
	}

	public static set Status(status: string)
	{
		Settings._status = status;

		localStorage["Settings.Status"] = Settings._status;
	}
	// #endregion

	// #region Password
	public static _password;

	public static get Password(): string
	{
		if (!Settings._password)
			Settings._password = localStorage["Settings.Password"];

		return Settings._password;
	}

	public static set Password(password: string)
	{
		Settings._password = password;

		localStorage["Settings.Password"] = Settings._password;
	}
	// #endregion

	// #region MuteAudio
	public static _muteAudio;

	public static get MuteAudio(): boolean
	{
		if (!Settings._muteAudio)
			Settings._muteAudio = localStorage["Settings.MuteAudio"] == "true";

		return Settings._muteAudio;
	}

	public static set MuteAudio(mute: boolean)
	{
		Settings._muteAudio = mute;

		localStorage["Settings.MuteAudio"] = Settings._muteAudio;
	}
	// #endregion

	// #region MuteNotifications
	public static _muteNotifications;

	public static get MuteNotifications(): boolean
	{
		// Default to Muted state
		if (!localStorage["Settings.MuteNotifications"])
			localStorage["Settings.MuteNotifications"] = true;

		if (!Settings._muteNotifications)
			Settings._muteNotifications = localStorage["Settings.MuteNotifications"] == "true";

		return Settings._muteNotifications;
	}

	public static set MuteNotifications(mute: boolean)
	{
		Settings._muteNotifications = mute;

		localStorage["Settings.MuteNotifications"] = Settings._muteNotifications;
	}
	// #endregion

	// #region EnabledNotifications
	public static _enabledNotifications: Array<string>;

	public static get EnabledNotifications(): Array<string>
	{
		// Default to Muted state
		if (!localStorage["Settings.EnabledNotifications"])
			localStorage["Settings.EnabledNotifications"] = JSON.stringify([]);

		if (!Settings._enabledNotifications)
			Settings._enabledNotifications = JSON.parse(localStorage["Settings.EnabledNotifications"]);

		return Settings._enabledNotifications;
	}

	public static set EnabledNotifications(arr: Array<string>)
	{
		Settings._enabledNotifications = arr;

		localStorage["Settings.EnabledNotifications"] = JSON.stringify(Settings._enabledNotifications);
	}
	// #endregion

	// #region TimestampPrivate
	public static _timestampPrivate;

	public static get TimestampPrivate(): boolean
	{
		if (!Settings._timestampPrivate)
		{
			if (localStorage["Settings.TimestampPrivate"] === undefined)
				localStorage["Settings.TimestampPrivate"] = true;

			Settings._timestampPrivate = localStorage["Settings.TimestampPrivate"] == "true";
		}

		return Settings._timestampPrivate;
	}

	public static set TimestampPrivate(on: boolean)
	{
		Settings._timestampPrivate = on;

		localStorage["Settings.TimestampPrivate"] = Settings._timestampPrivate;
	}
	// #endregion

	// #region TimestampBroadcast
	public static _timestampBroadcast;

	public static get TimestampBroadcast(): boolean
	{
		if (!Settings._timestampBroadcast)
		{
			if (localStorage["Settings.TimestampBroadcast"] === undefined)
				localStorage["Settings.TimestampBroadcast"] = true;

			Settings._timestampBroadcast = localStorage["Settings.TimestampBroadcast"] == "true";
		}

		return Settings._timestampBroadcast;
	}

	public static set TimestampBroadcast(on: boolean)
	{
		Settings._timestampBroadcast = on;

		localStorage["Settings.TimestampBroadcast"] = Settings._timestampBroadcast;
	}
	// #endregion
}

//#region Enums

enum KeyCodes
{
	Enter = 13,
	Backspace = 8,
	Up = 38,
	Down = 40
}

enum MessageTypes
{
	Broadcast,
	Private,
	Group
}

enum SendTypes
{
	Text,
	Image
}

enum States
{
	Available,
	Away,
	Busy
}

enum DebugInfoTypes
{
	Users
}

//#endregion

// Send message on enter key
var inputKeyUp = function (evt)
{
	if (evt.keyCode == KeyCodes.Enter)
		Messaging.BroadcastSend();
};

// On document readu
$(document).ready(function ()
{
	// Get settings
	var username = Settings.Username;
	var colour = Settings.Colour || "333333";
	var status = Settings.Status;

	if (username)
	{
		$("#txtUsername").val(username);
		$("#txtColour").val(colour);
		$("#txtStatus").val(status);

		Account.Login(username, colour, status);
	}
	else
	{
		$("#txtColour").val(colour);

		$("#txtUsername").focus();
	}
});

function checkNotificationPermission(id: string)
{
	if (!("Notification" in window))
	{
		Settings.MuteNotifications = true;
    return false;
  }

	if (Notification.permission != "denied")
		Notification.requestPermission();

	return Notification.permission == "granted" && !Settings.MuteNotifications && Helpers.Contains(Settings.EnabledNotifications, m => m == id);
}

// On window focus
$(window).focus(function ()
{
	// Change state to available
	Users.ChangeState(States.Available);

	// Clear notifications
	Notifications.Clear();

	// Send pending seen messages
	Seen.SendQueue();

	// Focus chat box
	setTimeout(function ()
	{
		$("txtMessage").focus();
	}, 250);
});

// On window blur
$(window).blur(function ()
{
	// Change state to away
	Users.ChangeState(States.Away);
});

// On window resize
$(window).resize(function ()
{
	Helpers.ScrollBottom(Helpers.GetActiveChatId());

	var offset = 6 + 6 + 4 + 4;

	$("#userList li").each(function (i, elem)
	{
		var $elem = $(elem);
		var $name = $($elem.children(".name").get(0));
		var name = $elem.attr("data-user");

		var $unread = $name.children(".unread-count");

		var w = $elem.width();

		$name.html(name);

		$name.prepend($unread);

		if (w <= $name.width() + offset)
		{
			$name.text($name.text().replace(/\s/g, ".").replace(/[^A-Z\.]/g, ''));

			$name.prepend($unread);
		}
	});
});

class Errors
{
	public static Show(selector, msg): void
	{
		alert(msg);
	}
}

class Account
{
	public static CheckAuthInterval: number = null;

	public static Login(user?: string, colour?: string, status?: string)
	{
		var username = user || $("#txtUsername").val().trim();

		if (!/^[\w\-\s]+$/.test(username))
		{
			Errors.Show("#txtUsername", "Alphanumeric and spaces only please!");
			return;
		}

		if (!username)
		{
			Errors.Show("#txtUsername", "Listen cunt, you've not entered a username");
			return;
		}

		if (username.length > 25)
		{
			Errors.Show("#txtUsername", "Too fucking long, 25 motherfucking chars max");
			return;
		}

		var pickedColour = colour || $("#txtColour").val().trim();

		if (!/^[0-9A-F]{6}$/i.test(pickedColour))
		{
			Errors.Show("#txtColour", "Invalid motherfucking hex code");
			return;
		}

		status = status || $("#txtStatus").val();

		//var password = $("#txtPassword").val();

		socket.emit("authorise", {
			Username: username,
			Colour: pickedColour,
			Status: status,
			//Password: password,
			//HashedPassword: Settings.Password,
			State: document.hasFocus() ? States.Available : States.Away
		});
	}

	public static LoginKeyUp(evt)
	{
		if (evt.keyCode == KeyCodes.Enter)
			Account.Login();
	}

	public static LoginResponse(msg: ILoginResponse): void
	{
		if (msg.Success)
		{
			Settings.Username = msg.Username;
			Settings.Colour = msg.Colour;
			Settings.Status = msg.Status;

			var allUsers = msg.Users;

			Users.UpdateList(allUsers);

			// Bind event handlers
			socket.on("user connected", Users.Connected);
			socket.on("user disconnected", Users.Disconnected);
			socket.on("message broadcast", Messaging.BroadcastReceived);
			socket.on("message private", Messaging.PrivateReceived);
			//socket.on("message group", Messaging.GroupReceived);
			socket.on("typing start", Typing.TypingStartReceived);
			socket.on("typing stop", Typing.TypingStopReceived);
			socket.on("message seen", Seen.Received);
			socket.on("state change", Users.StateChangeReceived);
			socket.on("check auth result", Account.CheckAuthResult);
			socket.on("check last active", Users.CheckLastActiveReceived);
			socket.on("echo", function (msg) { console.log(msg); });

			// Check Auth every 10 seconds!
			//Account.CheckAuthInterval = setInterval(Account.CheckAuth, 10 * 1000);

			$(".auth-wrap").hide();

			$(".title-bar").slideDown();

			Messaging.Init();
		}
		else
		{
			alert(msg.Message);
		}
	}

	public static CheckAuth(): void
	{
		var user = Settings.Username;

		if (!(<any>socket).connected)
			return;

		if (user)
		{
			socket.emit("check auth", { Username: user });
		}
		else
		{
			Account.CheckAuthResult({ Success: false });
		}
	}

	public static CheckAuthResult(msg: ICheckAuthMessage): void
	{
		if (!msg.Success)
		{
			Account.AutoLogin();
		}
	}

	public static AutoLogin(): void
	{
		var user = Settings.Username;
		var colour = Settings.Colour || "333333"; // default to dark grey
		var status = Settings.Status;

		socket.emit("auto login", { Username: user, Colour: colour, Status: status, State: document.hasFocus() ? States.Available : States.Away });
	}

	public static AutoLoginResponse(msg: ILoginResponse): void
	{
		if (msg.Success)
		{
			Settings.Username = msg.Username;
			Settings.Colour = msg.Colour;

			var allUsers = msg.Users;

			Users.UpdateList(allUsers);
		}
		else
		{
			alert(msg.Message);
		}
	}

	public static Logout()
	{
		Settings.Username = null;

		window.location.reload();
	}

	public static ToggleMute()
	{
		var isMuted = Settings.MuteAudio;

		if (isMuted)
		{
			Settings.MuteAudio = false;
			$("#btnMute").removeClass("muted");
		}
		else
		{
			Settings.MuteAudio = true;
			$("#btnMute").addClass("muted");
		}
	}

	public static ToggleNotifications()
	{
		var isMuted = Settings.MuteNotifications;

		if (isMuted)
		{
			Settings.MuteNotifications = false;
			$("#btnMuteNotifications").removeClass("disabled");
		}
		else
		{
			Settings.MuteNotifications = true;
			$("#btnMuteNotifications").addClass("disabled");
		}
	}
};

class Notifications
{
	public static GetTitle(): string
	{
		var title = "Sockets (";

		var totalPrivate = 0;

		// Count all unread messages
		for (var u in Messaging.UnreadCount)
		{
			if (u == "Broadcast" || u == "Server")
				continue;

			totalPrivate += Messaging.UnreadCount[u];
		}

		var hasGlob = !!Messaging.UnreadCount["Broadcast"];
		var hasServer = !!Messaging.UnreadCount["Server"];
		var hasPrivate = totalPrivate > 0;

		var parts = [];

		if (hasPrivate)
			parts.push(totalPrivate + " PM");

		if (hasGlob)
			parts.push(Messaging.UnreadCount["Broadcast"] + " BC");

		if (hasServer)
			parts.push(Messaging.UnreadCount["Server"] + " S");

		if (parts.length == 0)
			return "Sockets";

		for (var i = 0; i < parts.length; i++)
			title += (i == 0 ? "" : ", ") + parts[i];

		return title + ")";
	}

	public static Set(from?: string, isServer?: boolean)
	{
		var focus = window.document.hasFocus();

		from = from || "Broadcast"

		var upCount = function ()
		{
			Messaging.UnreadCount[from] = (Messaging.UnreadCount[from] ? Messaging.UnreadCount[from] : 0) + 1;
		}

		// If window is not in focus
		if (!focus)
		{
			upCount();

			if (!Settings.MuteAudio)
			{
				var audio = isServer ? new Audio("/audio/server.mp3") : new Audio("/audio/notify.mp3");

				audio.play();
			}

			// Set page title
			window.document.title = Notifications.GetTitle();
		}

		// Get ID of active chat
		var activeId = Helpers.GetActiveChatId();

		// Get chat id from name
		var id = Helpers.ChatIdFromName(from);

		// if tab is already focussed, don't notify
		if (activeId == id)
			return;

		if (focus)
			upCount();

		$("#userList li[data-user=\"" + from + "\"]").children(".name").html("<span class=\"unread-count\">(" + Messaging.UnreadCount[from] + ")</span> " + from); //.addClass("flashing");

		//$("ol.tabs [aria-controls=\"" + id + "\"]").children().text(from + " (" + Messaging.UnreadCount[from] + ")");
	}

	public static Clear()
	{
		// Get active panel name
		var name = Helpers.GetActiveChatName();

		var activeId = Helpers.GetActiveChatId();

		// Reset count for the active panel
		Messaging.UnreadCount[name] = 0;

		if (name == "Broadcast")
			Messaging.UnreadCount["Server"] = 0;

		// Remove count on tab
		$("#userList li[data-user=\"" + name + "\"]").children(".name").text(name); //.removeClass("flashing");

		// Update title
		window.document.title = Notifications.GetTitle();
	}

	public static ToastTimeout = 4000;

	public static DoToast(user: string, from: string, message: string)
	{
		if (window.document.hasFocus())
			return;

		if (checkNotificationPermission(from))
		{
			var pre = from == "messages_Broadcast" ? "Broadcast: " : "PM: ";

			var n = new Notification(pre + user, { body: message, tag: from });

			n.onclick = () => { };
			n.onshow = () => { setTimeout(() => { n.close(); }, Notifications.ToastTimeout); };
		}
	}

	public static ToggleForChat(id: string): void
	{
		var enabled = Settings.EnabledNotifications;

		if (Helpers.Contains(enabled, m => m == id))
		{
			Helpers.Remove(enabled, m => m == id);
		}
		else
		{
			enabled.push(id);
		}

		Settings.EnabledNotifications = enabled;

		$(".header-notification-icon").toggleClass("disabled");
	}
}

class Messaging
{
	public static UnreadCount = {
		Broadcast: 0
	}

	public static Initialised: boolean = false;

	public static Init()
	{
		$(".messenger").show();

		$('#txtMessage').focus();

		if (Settings.MuteAudio)
		{
			$("#btnMute").addClass("muted");
		}

		if (Settings.MuteNotifications)
		{
			$("#btnMuteNotifications").addClass("disabled");
		}

		var messenger: any = document.querySelector(".messenger");

		messenger.ondragover = Messaging.OnDragOver;
		messenger.ondragleave = Messaging.OnDragLeave;
		messenger.ondrop = Messaging.OnDrop;

		Typing.PollInterval = setInterval(Typing.Poll, 200);

		Messaging.Initialised = true;

		$("body").on("click", "img", Images.ToggleFullscreen);

		setInterval(Users.CheckLastActive, 10 * 1000);
	}

	public static BroadcastReceived(msg: IMessageMessage)
	{
		if (msg.Type == SendTypes.Text)
			Messaging.AddMessage("messages_Broadcast", MessageTypes.Broadcast, msg);
		else if (msg.Type == SendTypes.Image)
			Messaging.AddImage("messages_Broadcast", MessageTypes.Broadcast, msg);

		// Add notification
		Notifications.Set(msg.Username == "" ? "Server" : "Broadcast", msg.Username == "");

		Notifications.DoToast(msg.Username, "messages_Broadcast", msg.Message);

		// If not server message
		if (msg.Username)
		{
			// Send seen message or add to queue
			Seen.Process({
				Username: Settings.Username,
				To: "Broadcast",
				MessageId: msg.MessageId
			});
		}
	}

	public static BroadcastSend()
	{
		var msgTxt = $('#txtMessage').val().trim();

		// stop if no message
		if (!msgTxt)
			return;

		var msg: IMessageMessage = {
			Username: Settings.Username,
			Message: msgTxt,
			Type: SendTypes.Text,
			Timestamp: Helpers.GetTimestamp(),
			MessageId: Helpers.GetNewMessageId()
		};

		// Send message event
		socket.emit('message broadcast', msg);

		return false;
	}

	public static PrivateReceived(msg: ICallResult<IPrivateMessage>)
	{
		if (!msg.Success)
		{
			alert(msg.Error);
		}

		var from = msg.Result.Username;
		var id = Helpers.ChatIdFromName(from);

		// Add tab if doesn't exist
		if (!Helpers.TabExists(id))
		{
			Messaging.AddPrivateTab(from);
		}

		// Add either text or image
		if (msg.Result.Type == SendTypes.Text)
			Messaging.AddMessage(id, MessageTypes.Private, msg.Result);
		else if (msg.Result.Type == SendTypes.Image)
			Messaging.AddImage(id, MessageTypes.Private, msg.Result);

		var txt = msg.Result.Message;

		Notifications.Set(msg.Result.Username);

		Notifications.DoToast(from, id, txt);

		// Update side bar last message
		$("#userList li[data-user=\"" + from + "\"]").children(".last-message").html(txt);

		// Send seen message or add to queue
		Seen.Process({
			Username: Settings.Username,
			To: from,
			MessageId: msg.Result.MessageId
		});
	}

	public static PrivateSend(to: string): any
	{
		var msgTxt = $('#txtMessage').val().trim();

		// stop if no message
		if (!msgTxt)
			return;

		var msg: IPrivateMessage = {
			Username: Settings.Username,
			To: to,
			Message: msgTxt,
			Type: SendTypes.Text,
			Timestamp: Helpers.GetTimestamp(),
			MessageId: Helpers.GetNewMessageId()
		};

		// Send message event
		socket.emit('message private', msg);

		var id = Helpers.ChatIdFromName(to);

		// Echo to self
		Messaging.AddMessage(id, MessageTypes.Private, msg);

		return false;
	}

	//#region Private Tabs

	public static DisabledTabs = [];

	public static AddPrivateTab(name: string, switchTo?: boolean)
	{
		if (name == Settings.Username)
			return;

		// Get chat Id
		var id = Helpers.ChatIdFromName(name);

		if (switchTo)
		{
			// Make last tab inactive
			$("#messageWindows .message-list.active").removeClass("active");
			$("#userList li.active").removeClass("active");
			$("#userList li[data-user=\"" + name + "\"]").addClass("active");

			// Remove old header
			$(".message-header").remove();

			// Get user object
			var users = Users.All.filter(m => m.Username == name);

			// Add new header
			$("#messageWindows").prepend(Helpers.GetMessageHeader(name, id, users.length > 0 ? users[0].Status : "..."));
		}

		// If chat exists
		if ($("#" + id).length > 0)
		{
			// ...then switch to it
			if (switchTo)
			{
				// Make tab active
				$("#" + id).addClass("active");

				// Scroll to the bottom of the tab
				Helpers.ScrollBottom(Helpers.GetActiveChatId())

				// Clear notifications for newly opened tab
				Notifications.Clear();

				// Send seen event for last messages
				Seen.SendQueue();
				//var $lastMsg = $("#" + id + " li.message").not(".self").last();

				//if ($lastMsg)
				//{
				//	console.log($lastMsg);

				//	Seen.Process({
				//		Username: Settings.Username,
				//		To: name,
				//		MessageId: $lastMsg.attr("data-messageid")
				//	});
				//}

				// If chat is disabled (user offline)
				if ($("#" + id).hasClass("disabled"))
				{
					// Disable the input box
					$("#txtMessage").attr("disabled", "disabled");
				}
				else
				{
					// Make sure it's not disabled
					$("#txtMessage").removeAttr("disabled");

					// Focus the message text box
					//$("#txtMessage").focus();
					setTimeout(function () { $("#txtMessage").focus(); }, 100);
				}
			}

			return;
		}

		// Make new tab
		$("#messageWindows").append("<ul id=\"" + id + "\" class=\"message-list" + (switchTo ? " active" : "") + "\"></ul>");

		// Switch to new tab
		if (switchTo)
		{
			// Scroll to the bottom of the tab
			Helpers.ScrollBottom(Helpers.GetActiveChatId())

			// Clear notifications for newly opened tab
			Notifications.Clear();
		}
	}

	public static DisablePrivateTab(id: string)
	{
		$("#" + id).addClass("disabled");
	}

	public static CloseTab(id: string)
	{
		$("#" + id).remove();
	}

	//#endregion

	public static AddMessage(tab, mType: MessageTypes, msg: IMessageMessage)
	{
		var isServer = !msg.Username;
		var isPrivate = mType == MessageTypes.Private;
		var isBroadcast = mType == MessageTypes.Broadcast;
		var isSelfMessage = Settings.Username == msg.Username;

		var col = isServer ? null : Colours.Get(msg.Username);

		var message = "";

		if (msg.Message.indexOf("<s") !== 0)
		{
			// Format emoticons
			message = Emoticons.Format(msg.Message);

			// format hashtags
			message = Messaging.FormatHashes(message);

			// Turn URLs into links
			message = Messaging.FormatURL(message);
		}
		else
		{
			message = msg.Message;
		}

		// Create new list item
		var li = $('<li>');

		if (!isServer)
			li.attr("style", "color: " + col);

		// Set attributes
		li.attr("class", "message" + (isSelfMessage ? " self" : isServer ? " server" : ""));
		li.attr("title", msg.Timestamp ? msg.Timestamp : "");
		li.attr("data-messageid", msg.MessageId ? msg.MessageId : "");
		li.attr("data-from", msg.Username);

		var lastMessage = $("#" + tab + " li.message[data-messageid]").last();

		var firstInGroup = true;

		if (lastMessage.attr("data-from") == msg.Username)
		{
			firstInGroup = false;

			var now = new Date();

			var then = lastMessage.attr("title"); // title contains hh:mm

			var thenDate = new Date();

			thenDate.setHours(parseInt(then.split(":")[0]));
			thenDate.setMinutes(parseInt(then.split(":")[1]));

			// if last message was more than 2 minutes ago
			if (Math.abs(<any>now - <any>thenDate) >= (2 * 60 * 1000))
			{
				lastMessage.addClass("space-bottom");
				firstInGroup = true;
			}
		}

		var msgInner = "<span class=\"message-inner\">" + message + "</span>";

		if ((isPrivate && Settings.TimestampPrivate) || (isBroadcast && Settings.TimestampBroadcast))
		{
			var ts = "<span class=\"timestamp\">" + msg.Timestamp + "</span>";

			msgInner = isSelfMessage ? msgInner + ts : ts + msgInner;
		}

		if (isServer)
		{
			li.html("<span class=\"message\">" + msgInner + "</span>");
		}
		else
		{
			var liHtml = "";

			liHtml += "<span class=\"message\">" + (firstInGroup ? "<div class=\"arrow\"></div>" : "");

			liHtml += msgInner;

			if (isPrivate && isSelfMessage)
				liHtml += "<span class=\"seen-icon\"><span class=\"inner\"></span></span>";

			liHtml += "</span>";

			li.html(liHtml);

			if (isBroadcast)
			{
				var nHtml = "";

				nHtml += "<span class=\"name\" style=\"background-color: " + col + "\">";
				nHtml += msg.Username.substring(0, 1).toUpperCase();
				nHtml += "</span>";

				if (lastMessage && lastMessage.attr("data-from") == msg.Username)
					li.addClass("indented");
				else
					li[isSelfMessage ? "append" : "prepend"](nHtml);
			}
		}

		var peopleTyping = $('#' + tab + " .typing").length > 0;

		if (!peopleTyping)
		{
			// If nobody is typing append to end
			$('#' + tab).append(li);
		}
		else
		{
			// if people typing, append before first typing li
			$("#" + tab + " .typing").first().before(li);
		}

		Helpers.ScrollBottom(tab);
	}

	public static AddImage(tab, type, msg: IMessageMessage)
	{
		var isServerMessage = !msg.Username;
		var isSelfMessage = Settings.Username == msg.Username;

		var li = $('<li>');

		if (!isServerMessage)
		{
			li.attr("style", "color: " + Colours.Get(msg.Username));
		}

		li.attr("class", "message" + (isSelfMessage ? " self" : isServerMessage ? " server" : ""));
		li.attr("title", msg.Timestamp ? msg.Timestamp : "");

		li.html((type != MessageTypes.Private && !isServerMessage && !isSelfMessage ? msg.Username + ": " : ""));

		var img = $("<img>");

		img.attr("src", msg.Message);

		li.append(img);

		var peopleTyping: boolean = $('#' + tab + " .typing").length > 0;

		if (!peopleTyping)
		{
			// If nobody is typing append to end
			$('#' + tab).append(li);
		}
		else
		{
			// if people typing, append before first typing li
			$("#" + tab + " .typing").first().before(li);
		}

		Helpers.ScrollBottom(tab);
	}

	public static Send()
	{
		var activeId = Helpers.GetActiveChatId();

		if (activeId == "messages_Broadcast")
		{
			// Send broadcast if that tab is active
			Messaging.BroadcastSend();

			MessageHistory.Add($('#txtMessage').val(), "Broadcast");
		}
		else
		{
			// Otherwise send private message
			var to = Helpers.NameFromChatId(activeId);

			Messaging.PrivateSend(to);
		}

		// reset msg box
		$('#txtMessage').val('');
	}

	public static SendImage(img: string): void
	{
		var activeId = Helpers.GetActiveChatId();

		if (activeId == "messages_Broadcast")
		{
			socket.emit('message broadcast', {
				Username: Settings.Username,
				Message: img,
				Type: SendTypes.Image,
				Timestamp: Helpers.GetTimestamp(),
				MessageId: Helpers.GetNewMessageId()
			});
		}
		else
		{
			var msg: IPrivateMessage = {
				Username: Settings.Username,
				To: Helpers.NameFromChatId(activeId),
				Message: img,
				Type: SendTypes.Image,
				Timestamp: Helpers.GetTimestamp(),
				MessageId: Helpers.GetNewMessageId()
			};

			socket.emit('message private', msg);

			// Echo to self
			Messaging.AddImage(activeId, MessageTypes.Private, msg);
		}
	}

	//#region Key Events

	public static KeyUp(evt)
	{
		if (evt.keyCode == KeyCodes.Enter)
		{
			Messaging.Send();
		}
		else if (evt.keyCode == KeyCodes.Up)
		{

		}
		else if (evt.keyCode == KeyCodes.Backspace)
		{

		}
	}

	public static KeyPress(evt)
	{

	}

	//#endregion

	public static FormatHashes(str): string
	{
		return str;//.replace(/#(\w+)/g, "<span class=\"hashtag\">#$1</span>");
	}

	public static FormatURL(str: string): string
	{
		var urlStart = str.indexOf("http");

		if (urlStart == -1)
			return str;

		var urlEnd = str.indexOf(" ", urlStart);

		if (urlEnd == -1)
			urlEnd = str.length;

		var link = str.substring(urlStart, urlEnd);

		var a = "<a href=\"" + link + "\" target=\"_blank\">" + link + "</a>";

		return str.replace(link, a);
	}

	//#region Drag and Drop

	public static OnDragOver(e: any): void
	{
		var evt = e || window.event;

		Helpers.CancelEvent(evt);

		$(".messenger").addClass("drag-hover");
	}

	public static OnDragLeave(e: any): void
	{
		var evt = e || window.event;

		Helpers.CancelEvent(evt);

		$(".messenger").removeClass("drag-hover");
	}

	public static OnDrop(e: any): void
	{
		var evt = e || window.event;

		Helpers.CancelEvent(evt);

		$(".messenger").removeClass("drag-hover");

		var dt: any = evt.dataTransfer;

		if (dt.files.length > 0)
		{
			for (var i = 0; i < dt.files.length; i++)
			{
				var reader = new FileReader();

				reader.onload = function (e)
				{
					Messaging.SendImage((<any>e.target).result);
				};

				reader.readAsDataURL(dt.files[i]);
			}

			return;
		}

		var txt = dt.getData("Text");

		if (txt)
		{
			Messaging.SendImage(txt);
		}
	}

	//#endregion
};

class Users
{
	public static All: IUser[] = [];
	public static DisconnectedUsers: IUser[] = [];

	public static RefreshBuffer = [];

	public static Connected(msg: IConnectionChangedMessage)
	{
		var message = "";

		if (Helpers.Count(Users.RefreshBuffer, m => m.Username == msg.Username))
		{
			var bufferedUser = Helpers.First(Users.RefreshBuffer, m => m.Username == msg.Username);

			clearTimeout(bufferedUser.Timeout);

			Helpers.Remove(Users.RefreshBuffer, m => m.Username == msg.Username);

			var messages = [
				" has refreshed."
			];

			message = msg.Username + messages[Math.floor(Math.random() * messages.length)];
		}
		else
		{
			var messages = [
				" has connected."
			];

			message = msg.Username + messages[Math.floor(Math.random() * messages.length)];
		}

		// Construct message
		var serverMessage: IMessageMessage = {
			Username: "",
			Message: message,
			Type: SendTypes.Text,
			Timestamp: Helpers.GetTimestamp(),
			MessageId: Helpers.GetNewMessageId()
		};

		// Add server message to broadcast chat
		Messaging.BroadcastReceived(serverMessage);

		Users.UpdateList(msg.Users);
	}

	public static Disconnected(msg: IConnectionChangedMessage)
	{
		var messages = [
			" has disconnected."
		];

		// Add to refresh buffer
		Users.RefreshBuffer.push({
			Username: msg.Username,
			Timeout: setTimeout(function ()
			{
				// Remove from refresh buffer
				Helpers.Remove(Users.RefreshBuffer, m => m.Username == msg.Username);

				// Construct disconnect message
				var serverMessage: IMessageMessage = {
					Username: "",
					Message: msg.Username + messages[Math.floor(Math.random() * messages.length)],
					Type: SendTypes.Text,
					Timestamp: Helpers.GetTimestamp(),
					MessageId: Helpers.GetNewMessageId()
				};

				// Add server message to broadcast chat
				Messaging.BroadcastReceived(serverMessage);
			}, 1200)
		});

		// Get chat if from name
		var id = Helpers.ChatIdFromName(msg.Username);

		// Check private tab exists
		if (Helpers.TabExists(id))
		{
			//Messaging.DisablePrivateTab(id);
		}

		// Refresh right side menu
		Users.UpdateList(msg.Users);
	}

	public static UpdateList(users: IUser[])
	{
		// Process disconnected user(s)
		for (var i = 0; i < Users.All.length; i++)
		{
			var match = m => m.Username == Users.All[i].Username;

			// if the user isn't in here, they've disconnected
			if (!Helpers.Contains(users, match))
			{
				// If not already in disconnected list
				if (!Helpers.Contains(Users.DisconnectedUsers, match))
					// Add to disconnected list
					Users.DisconnectedUsers.push(Users.All[i]);
			}
			else
			{
				// If user is in disconnected list
				if (Helpers.Contains(Users.DisconnectedUsers, match))
					// Remove them from disconnected list
					Helpers.Remove(Users.DisconnectedUsers, match);
			}
		}

		// Update local list of users
		Users.All = users;

		// Reset list
		$("#userList").html("");

		// List toggle
		//$("#userList").append($("<li class=\"list-toggle\" title=\"Toggle list\" onclick=\"Users.ToggleList()\">&lt;</li>"));

		var add = function (user: string, status: string, seen?: any, disabled?: boolean)
		{
			// Create new li
			var li = $("<li data-user=\"" + user + "\" onclick=\"Messaging.AddPrivateTab('" + user + "', true)\"" + (status ? " title=\"" + status + "\"" : "") + ">");

			if (disabled)
				li.addClass("disabled");

			if (user == Settings.Username)
				li.addClass("self");

			// Add state icon
			var html = "<span class=\"state-icon\"></span>";

			// Count of unread messages
			var msgCount = Messaging.UnreadCount[user];

			// Add user's name with colour and unread message count
			html += "<span class=\"name\" style=\"color: " + Colours.Get(user) + "\">" + (msgCount ? "(" + msgCount + ") " : "") + user + "</span><br />";

			if (user != "Broadcast")
			{
				var lastMsg = "";

				var $chat = $("#" + Helpers.ChatIdFromName(user)).first();

				if ($chat.length !== 0)
				{
					var $last = $chat.children("[data-from=\"" + user + "\"]").last();

					if ($last.length !== 0)
					{
						lastMsg = $last.children().get(0).innerHTML;
					}
				}

				html += "<span class=\"last-message\">" + lastMsg + "</span>";

				if (!disabled)
					html += "<span class=\"last-seen\">" + (seen ? Helpers.GetLastActive(seen) : "loading") + "</span>";
			}
			// Add state icon and text
			li.html(html);

			// Add new li to DOM
			$("#userList").append(li);
		}

		add("Broadcast", "");

		// Add each user to the right menu
		for (var u in users)
		{
			add(users[u].Username, users[u].Status, users[u].LastSeen);

			// Manually update local state info
			Users.StateChangeReceived({
				Username: users[u].Username,
				State: users[u].State,
				TimeStamp: new Date() + ""
			});
		}

		// Add disconnected users to right menu
		//for (var u in Users.DisconnectedUsers)
		//{
		//	var dcUser = Users.DisconnectedUsers[u];

		//	add(dcUser.Username, dcUser.Status, null, true);
		//}
	}

	public static ToggleList(): void
	{
		$("#userList").toggleClass("open");
	}

	public static ChangeState(state: States)
	{
		// Send event with current state
		socket.emit("state change", {
			Username: Settings.Username,
			State: state,
			TimeStamp: new Date() + ""
		});
	}

	public static StateChangeReceived(msg: IStateChangedMessage)
	{
		// For each user in the right menu
		$("#userList li").each((i, elem) =>
		{
			var user = $(elem).attr("data-user");

			var $elem = $(elem);

			// Update class
			if (msg.Username == user)
			{
				$elem.removeClass("state-available");
				$elem.removeClass("state-away");
				$elem.removeClass("state-busy");

				$elem.addClass("state-" + States[msg.State].toLowerCase());
			}
		});
	}

	public static CheckLastActive(): void
	{
		socket.emit("check last active", { Username: Settings.Username });
	}

	public static CheckLastActiveReceived(msg: ILastActiveMessage): void
	{
		for (var i = 0; i < msg.Results.length; i++)
		{
			var li = $("#userList li[data-user=\"" + msg.Results[i].Username + "\"]");

			li.children(".last-seen").get(0).innerText = Helpers.GetLastActive(msg.Results[i].LastActive);
		}
	}
}

class Typing
{
	public static To = {
		Broadcast: false
	}

	public static PollInterval;

	public static Poll(): void
	{
		var isTyping = $("#txtMessage").val() != "";

		var name = Helpers.GetActiveChatName();

		var msg = {
			Username: Settings.Username,
			To: name
		};

		if (isTyping && !Typing.To[name])
		{
			Typing.To[name] = true;

			socket.emit("typing start", msg);
		}
		else if (!isTyping && Typing.To[name])
		{
			Typing.To[name] = false;

			socket.emit("typing stop", msg);
		}
	}

	public static TypingStartReceived(msg: ITypingMessage)
	{
		var from = msg.Username;
		var to = msg.To;

		var chatId = Helpers.ChatIdFromName(to == "Broadcast" ? to : from);

		Typing.UpdateTypingStatus(chatId, from, true);

		Typing.UpdateTypingStatus2(from, true);
	}

	public static TypingStopReceived(msg: ITypingMessage)
	{
		var from = msg.Username;
		var to = msg.To;

		var chatId = Helpers.ChatIdFromName(to == "Broadcast" ? to : from);

		Typing.UpdateTypingStatus(chatId, from, false);

		Typing.UpdateTypingStatus2(from, false);
	}

	public static UpdateTypingStatus(tab: string, name: string, typing: boolean)
	{
		if (!Helpers.TabExists(tab))
			return;

		if (typing)
		{
			// If typing li already exists
			if ($("#" + tab + " .typing").length > 0)
			{
				// Use existing li
				var li = $("#" + tab + " .typing").first();

				// Add name to who attr
				li.attr("data-who", li.attr("data-who") + "," + name);

				// Get array of typing people
				var who = li.attr("data-who").split(",");

				// Build message
				var text = "";

				for (var i = 0; i < who.length; i++)
				{
					text += (i == 0 ? "" : i == who.length - 1 ? " and " : ", ");
					text += who[i];
				}

				text += " are typing...";

				// Update li text
				li.text(text);
			}
			else
			{
				// Create new li
				var li = $('<li>');

				li.attr("data-who", name);

				if (tab == "messages_Broadcast")
				{
					li.attr("class", "typing");
					li.html(name + " is typing...");
				}
				else
				{
					li.attr("class", "message typing");
					li.html("<span class=\"message\"><span class=\"dot-one\">.</span><span class=\"dot-two\">.</span><span class=\"dot-three\">.</span></span>");
				}

				//<span class="dot-one">.</span><span class="dot-two">.</span><span class="dot-three">.</span>

				$('#' + tab).append(li);

				Helpers.ScrollBottom(tab);
			}
		}
		else
		{
			var li = $("#" + tab + " .typing").first();

			if (!li.attr("data-who"))
				return;

			var who = li.attr("data-who").split(",");

			if (who.length == 1 && who[0] == name)
			{
				$("#" + tab + " .typing").remove();

				return;
			}

			// Remove "name" from array
			who.splice(who.indexOf(name), 1);

			if (who.length > 1)
			{
				var attr = "";
				var text = "";

				for (var i = 0; i < who.length; i++)
				{
					attr += (i == 0 ? "" : ",") + who[i];

					text += (i == 0 ? "" : i == who.length - 1 ? " and " : ", ");
					text += who[i];
				}

				text += " are typing...";

				li.attr("data-who", attr);
				li.text(text);
			}
			else
			{
				li.attr("data-who", who[0]);
				li.text(who[0] + " is typing...");
			}
		}
	}

	public static UpdateTypingStatus2(name: string, typing: boolean)
	{
		var $userLi = $("#userList li[data-user=\"" + name + "\"]");

		if (typing)
		{
			$userLi.children(".last-message").before("<span class=\"typing\">Typing<span class=\"dot-one\">.</span><span class=\"dot-two\">.</span><span class=\"dot-three\">.</span></span>");

		}
		else
		{
			$userLi.children(".typing").remove();
		}
	}
}

//#region Seen

/*
 
Message Received:
	- If window focus && active chat then send seen else add to queue

Window Focus or active chat changed:
	- Send Queue for active chat

Seen Message Received:
	- Check message exists
	- Add / change attribute of message to include name
	- Add / change li text after last seen message, remove references from others

*/

class Seen
{
	public static Queue: ISeenMessage[];

	public static Process(msg: ISeenMessage): void
	{
		// Is window in focus
		var focus = window.document.hasFocus();

		// Which chat window is open
		var activeChat = Helpers.GetActiveChatId();

		// Is this message part of the chat that's currently open
		var chatIsActive = activeChat == Helpers.ChatIdFromName(msg.To);

		// If window is open & correct chat is in focus, then send the seen event
		if (focus && chatIsActive)
		{
			socket.emit("message seen", msg);
		}
		else
		{
			if (!Seen.Queue)
				Seen.Queue = [];

			// Add to queue to send when window / chat is focused 
			Seen.Queue.push(msg);
		}
	}

	public static SendQueue(): void
	{
		if (!Seen.Queue)
			return;

		var activeChatName = Helpers.GetActiveChatName();

		var messages = Seen.Queue.filter(m => m.To == activeChatName);

		for (var m in messages)
		{
			// Send event
			socket.emit("message seen", messages[m]);

			// Remove from seen queue after sending
			Seen.Queue.splice(Seen.Queue.indexOf(messages[m]), 1);
		}
	}

	public static Received(msg: ISeenMessage): void
	{
		var from = msg.Username;
		var to = msg.To;
		var msgId = msg.MessageId;

		// If message doesn't exist
		if ($("[data-messageid=\"" + msgId + "\"]").length === 0)
			return;

		// In which chat was the message seen
		var chatId = Helpers.ChatIdFromName(to == "Broadcast" ? to : from);

		// jQuery selector for which message was seen
		var selector = "#" + chatId + " [data-messageid=\"" + msgId + "\"]";

		// Message element
		var li = $(selector);

		// Get "seen by" attr
		var attr = li.attr("data-seenby");

		if (attr)
		{
			// Update attr if not there already
			if (attr.indexOf(from) == -1)
				li.attr("data-seenby", attr + "," + from);
		}
		else
		{
			// Set new attr
			li.attr("data-seenby", from);
		}

		var $chat = $("#" + chatId);
		var $seen = $("#" + chatId + " .seen");

		// Broadcast or pm?
		if (to == "Broadcast")
		{
			/// Remove old li
			$("#" + chatId + " .seen").each((index, elem) =>
			{
				var attr = $(elem).attr("data-who");

				var names = attr.split(",");

				// Only change if from name is present
				if (names.indexOf(from) == -1)
					return;

				// If "from" is the last/only name then remove the li
				if (names.length == 1 && names[0] == from)
				{
					$(elem).remove();
					return;
				}

				// Remove "from" from array
				names.splice(names.indexOf(from), 1);

				// Build new text + attr
				var text = "Seen by ";
				var newAttr = "";

				for (var i = 0; i < names.length; i++)
				{
					text += (i === 0 ? "" : i == names.length - 1 ? " and " : ", ") + names[i];
					newAttr += (i === 0 ? "" : ",") + names[i];
				}

				$(elem).text(text);
				$(elem).attr("data-who", newAttr);
			});

			var lastId = Helpers.GetMessageIdOfLastSeen("messages_Broadcast", from);

			var nextLi = $("[data-messageid=\"" + lastId + "\"]").next();

			// If the message already has a seen li after it
			if (nextLi && nextLi.hasClass("seen"))
			{
				// Who has seen the message?
				var who = li.attr("data-seenby").split(",");

				// Build "Seen by x, y, z" string
				var text = "Seen by ";

				for (var i = 0; i < who.length; i++)
					text += (i === 0 ? "" : i == who.length - 1 ? " and " : ", ") + who[i];

				// Change text of existing li
				nextLi.text(text);

				// Update the who attr
				nextLi.attr("data-who", nextLi.attr("data-who") + "," + from);
			}
			else
			{
				// Create new li
				var li = $("<li>", {
					"data-who": from,
					"class": "seen"
				});

				// Seen by person
				li.html("Seen by " + from);

				// Add to tab

				if ($("#messages_Broadcast .typing").length > 0)
				{
					$("#messages_Broadcast .typing").first().before(li)
				}
				else
				{
					$chat.append(li);
				}

				Helpers.ScrollBottom(chatId);
			}
		}
		else
		{
			// Do dots only on pm
			//$seen.remove();

			//var li = $("<li>", {
			//	"data-who": name,
			//	"class": "seen"
			//});

			//li.html("Seen " + Helpers.GetTimestamp());

			//$chat.append(li);
		}
	}
}

//#endregion

class Images
{
	public static ToggleFullscreen(): void
	{
		$(this).toggleClass("fullscreen");

		if ($(this).hasClass("fullscreen"))
		{
			var margin = 20;

			$(this).css("max-width",($(window).width() - margin) + "px");
			$(this).css("max-height",($(window).height() - margin) + "px");
		}
		else
		{
			$(this).css("max-width", "");
			$(this).css("max-height", "");
		}
	}
}

//#region Emoticons

var Emoticons = {
	":)": { RegEx: "\\:\\)", Class: "smile new" },
	":(": { RegEx: "\\:\\(", Class: "frown new" },
	":D": { RegEx: "\\:D", Class: "grin new" },
	"(Y)": { RegEx: "\\([Yy]\\)", Class: "like new" },
	"(N)": { RegEx: "\\([Nn]\\)", Class: "dislike new" },
	";)": { RegEx: "\\;\\)", Class: "wink new" },
	":p": { RegEx: "\\:[Pp]", Class: "tongue new" },
	":3": { RegEx: "\\:3", Class: "colonthree" },
	":/": { RegEx: "\\:\\/", Class: "unsure new" },
	":o": { RegEx: "\\:[Oo]", Class: "gasp new" },
	":'(": { RegEx: "\\:\\'\\(", Class: "cry new" },
	"^_^": { RegEx: "\\^\\_\\^", Class: "kiki new" },
	"8-)": { RegEx: "8\\-\\)", Class: "glasses" },
	"B|": { RegEx: "B\\|", Class: "sunglasses new" },
	"<3": { RegEx: "\\<3", Class: "heart new" },
	"</3": { RegEx: "\\<\\/3", Class: "brokenheart new" },
	"-_-": { RegEx: "\\-\\_\\-", Class: "squint new" },
	"_-_": { RegEx: "\\_\\-\\_", Class: "usquint new" },
	"o.O": { RegEx: "[Oo]\\.[Oo]", Class: "confused" },
	":L": { RegEx: "\\:[Ll]", Class: "laughing new" },
	":'L": { RegEx: "\\:\\'[Ll]", Class: "laughingcry new" },
	"D:": { RegEx: "[D]\\:", Class: "aaah new" },
	":S": { RegEx: "\\:[Ss]", Class: "anxious new" },
	":v": { RegEx: "\\:[Vv]", Class: "pacman" },
	"o:)": { RegEx: "[Oo]\\:\\)", Class: "angel new" },
	":*": { RegEx: "\\:\\*", Class: "kiss new" },
	"/mwah": { RegEx: "\\/mwah", Class: "kiss new" },
	";P": { RegEx: "\\;[pP]", Class: "winkp new" },
	"=)": { RegEx: "\\=\\)", Class: "teehee new" },
	":'D": { RegEx: "\\:\\'[D]", Class: "crygrin new" },
	":|": { RegEx: "\\:\\|", Class: "omg new" },
	"/bh": { RegEx: "\\/bh", Class: "blowheart new" },
	":@": { RegEx: "\\:\\@", Class: "angry new" },
	"/poop": { RegEx: "\\/poop", Class: "poop" },
	"/bravo": { RegEx: "\\/bravo", Class: "clap" },
	"/ok": { RegEx: "\\/ok", Class: "okhand" },
	"/ace": { RegEx: "\\/ace", Class: "ace new" },
	"/boof": { RegEx: "\\/boof", Class: "boof new" },
	"/finger": { RegEx: "\\/finger", Class: "finger" },
	"/wank": { RegEx: "\\/wank", Class: "wank new" },
	"/hand": { RegEx: "\\/hand", Class: "hand" },
	"/flex": { RegEx: "\\/flex", Class: "flex" },
	"/splat": { RegEx: "\\/splat", Class: "splat" },
	"/moist": { RegEx: "\\/moist", Class: "moist" },
	"/willy": { RegEx: "\\/willy", Class: "willy" },
	"/flange": { RegEx: "\\/flange", Class: "flange" },
	"/camel": { RegEx: "\\/camel", Class: "camel" },
	"/cow": { RegEx: "\\/cow", Class: "cow" },
	"/dolphin": { RegEx: "\\/dolphin", Class: "dolphin new" },
	"/skull": { RegEx: "\\/skull", Class: "skull new" },
	//"/partygirl": { RegEx: "\\/partygirl", Class: "partygirl new" },

	"/balls": { RegEx: "\\/balls", Class: "balls new" },
	"/shaft": { RegEx: "\\/shaft", Class: "shaft new" },
	"/bellend": { RegEx: "\\/bellend", Class: "bellend new" },

	Format: function (str)
	{
		var repl = function (s)
		{
			var find = "(\\s|^)" + Emoticons[e].RegEx + "(\\s|$)";

			return s.replace(new RegExp(find, "g"), "$1<span class=\"emoticon emoticon_" + Emoticons[e].Class + "\"></span>$2");
		};

		for (var e in Emoticons)
		{
			if (e == "Format")
				continue;

			str = repl(repl(str));
		}

		return str;
	},

	PopulateSmileyBox: function () 
	{
		var html = "";

		for (var e in Emoticons)
		{
			if (!Emoticons[e].RegEx)
				continue;

			html += "<div class=\"smiley-wrap\" onclick=\"Emoticons.AddFromBox('" + Helpers.HtmlEncode(e).replace("'", "&#39;") + "')\">";
			html += "<span class=\"smiley-text\">" + Helpers.HtmlEncode(e) + "</span>" + Emoticons.Format(e);
			html += "</div>";
		}

		$("#smileyBox").html(html);
	},

	AddFromBox: function (smiley)
	{
		var val = Helpers.HtmlDecode(smiley).replace("&#39;", "'");

		var msg = $("#txtMessage").val();

		$("#txtMessage").val((msg ? msg + " " : "") + val);

		$("#txtMessage").focus();
	},

	ToggleHelp: function ()
	{
		if ($("#smileyBox").html() == "")
		{
			Emoticons.PopulateSmileyBox();
			$("#smileyBox").addClass("open");
		}
		else
		{
			$("#smileyBox").html("");
			$("#smileyBox").removeClass("open");
		}
	},

	Add: function ()
	{
		var val = $("#txtMessage").val();

		// add clicked on emoji

		$("#txtMessage").val(val);
	}
}

//#endregion

class Helpers
{
	public static GetTimestamp(): string
	{
		var d = new Date();

		return Helpers.PadLeft(d.getHours(), 2, "0") + ":" +
			Helpers.PadLeft(d.getMinutes(), 2, "0");
	}

	public static GetNewMessageId(): string
	{
		return new Date().getTime() + "";
	}

	public static GetDateTime(): string
	{
		var d = new Date();

		return Helpers.PadLeft(d.getDate(), 2, "0") + "/" +
			Helpers.PadLeft(d.getMonth() + 1, 2, "0") + " " +
			Helpers.PadLeft(d.getHours(), 2, "0") + ":" +
			Helpers.PadLeft(d.getMinutes(), 2, "0");
	}

	public static PadLeft(str: any, length: number, char: string): string
	{
		if (typeof (str) !== "string")
			str = str + "";

		while (str.length < length)
			str = char + str;

		return str;
	}

	public static ScrollBottom(id: string): void
	{
		if ((<HTMLInputElement>$("#chkDisableScroll")[0]).checked)
			return;

		if (id.indexOf("#") == 0)
			id = id.substring(1, id.length);

		var elem = document.getElementById(id);

		var scrolledToTop = elem.scrollTop === 0;
		var scrolledToBottom = elem.scrollHeight - elem.scrollTop == elem.clientHeight;

		//if (scrolledToTop || scrolledToBottom)
		{
			elem.scrollTop = elem.scrollHeight;
		}
	}

	public static ChatIdFromName(name: string): string
	{
		return "messages_" + name.replace(/\s/g, "_");
	}

	public static NameFromChatId(id: string): string
	{
		return id
			.split("messages_")[1]
			.replace(/\_/g, " ");
	}

	public static GetActiveChatId()
	{
		return $(".message-list.active").get(0).id;
	}

	public static GetActiveChatName()
	{
		// Get active panel
		var activeId = Helpers.GetActiveChatId();

		return Helpers.NameFromChatId(activeId);
	}

	public static TabExists(id: string)
	{
		return $("#" + id).length > 0;
	}

	public static CancelEvent(e: any): void
	{
		e.stopPropagation();
		e.preventDefault();
	}

	public static GetMessageIdOfLastSeen(tab: string, user: string)
	{
		var lastId = null;

		$("#" + tab + " .message").each(function (index, elem)
		{
			var seenBy = $(elem).attr("data-seenby");

			if (seenBy)
			{
				var users = seenBy.split(",");

				if (users.indexOf(user) > -1)
					lastId = $(elem).attr("data-messageid");
			}
		});

		return lastId;
	}

	public static GetLastActive(date: any): string
	{
		if (!date)
			return "unknown";

		var d: Date = typeof (date) == "string" ? new Date(date) : <Date>date;

		var diff = (<any>new Date()) - (<any>d);

		var diffSecs = diff / 1000;

		if (diffSecs < 60)
			return "<1m";
		//return Math.floor(diffSecs) + "s";

		var diffMins = diffSecs / 60;

		if (diffMins < 60)
			return Math.floor(diffMins) + "m";

		var diffHours = diffMins / 60;

		return Math.floor(diffHours) + "h";
	}

	public static FixIndents(): void
	{
		$("li.message.indented").each(function (i, e)
		{
			if ($(e).css("margin-left") !== "0px")
				return;

			console.log(e);
		});
	}

	public static Where = function (a, f: Function) { return a.filter(f); }
	public static First = function (a, f: Function) { return a.filter(f)[0]; }
	public static Count = function (a, f: Function) { return a.filter(f).length; }
	public static Contains = function (a, f: Function) { return a.filter(f).length > 0; }
	public static Remove = function (a: Array<any>, f: Function)
	{
		var items = Helpers.Where(a, f);
		var removed = [];

		for (var i in items)
		{
			var arrPos = a.indexOf(items[i]);

			removed.push(a.splice(arrPos, 1));
		}

		return removed;
	}

	public static HtmlEncode(value)
	{
		return $('<div/>').text(value).html();
	}

	public static HtmlDecode(value)
	{
		return $('<div/>').html(value).text();
	}

	public static GetMessageHeader(name: string, chatId: string, status: string): string
	{
		var html = "";

		html += "<div class=\"message-header clear-children\">";

		html += "<div class=\"image\" style=\"background-color: " + Colours.Get(name) + "\"></div>";

		html += "<div class=\"name\" style=\"color: " + Colours.Get(name) + "\">" + name + "</div>";

		html += "<div class=\"status-bar\">" + (status || "") + "</div>";

		var enabled = Helpers.Contains(Settings.EnabledNotifications, m => m == chatId);

		html += "<div class=\"header-notification-icon" + (!enabled ? " disabled" : "") + "\" onclick=\"Notifications.ToggleForChat('" + chatId + "')\"><div class=\"inner\"></div></div>";

		html += "</div>"; // .message-header

		return html;
	}
}

//#region Colours

var Colours = {

	Values: [],

	Get: function (name)
	{
		var users = Users.All.filter(usr => usr.Username == name);

		var colour = "#000000";

		if (users.length > 0)
			colour = users[0].Colour

		if (colour.indexOf("#") != 0)
			colour = "#" + colour;

		return colour;
	},

	Set: function (name, val)
	{
		Colours.Values[name] = val;
	},

	Clear: function ()
	{
		Colours.Values = [];
	},

	SelectionBoxKeyPress: function (e)
	{
		var colour = $("#txtColour").val().trim();

		if (e.keyCode == KeyCodes.Backspace)
			colour = colour.substring(0, colour.length - 1);
		else
			colour += String.fromCharCode(e.keyCode);

		if (/^[0-9A-F]{6}$/i.test(colour))
		{
			Colours.UpdateSelectionBox(colour);
		}
	},

	UpdateSelectionBox: function (colour)
	{
		if (colour.indexOf("#") != 0)
			colour = "#" + colour;

		$("#txtColour").css("color", colour);
	}
}

//#endregion

class Debug
{
	public static GetInfo(type: DebugInfoTypes): void
	{
		if (!type)
			type = 0;

		var msg: IDebugInfoRequest = {
			InfoType: type
		}

		socket.emit("debug info", msg);
	}

	public static DebugInfoResult(msg: any): void
	{
		if (true) // if is users...
		{
			for (var u in msg)
			{
				console.group(msg[u].Username);

				for (var prop in msg[u])
				{
					if (prop == "LastSeen")
						console.log(prop, Helpers.GetLastActive(msg[u][prop]));
					else
						console.log(prop, msg[u][prop]);
				}

				console.groupEnd();
			}
		}
	}
}

class MessageHistory
{
	public static Queues = {
		Broadcast: []
	};

	public static Add(msg: string, queue: string)
	{
		if (MessageHistory.Queues[queue].length >= 10)
			MessageHistory.Queues[queue].shift();

		MessageHistory.Queues[queue].push(msg);
	}
}

// Open socket connection
var socket = io({ secure: false });

// Attach socket "events"
socket.on("login response", Account.LoginResponse);
socket.on("auto login response", Account.AutoLoginResponse);
socket.on("debug info", Debug.DebugInfoResult);

var initialised = false;

socket.on("connect", function ()
{
	if (initialised)
	{
		console.log("Socket OnConnect", "Initialised");

		Messaging.BroadcastReceived({
			Username: "",
			Message: "Connection re-established, attempting auto login.",
			Type: SendTypes.Text,
			Timestamp: Helpers.GetTimestamp(),
			MessageId: Helpers.GetNewMessageId()
		});

		Account.CheckAuth();
	}
	else
	{
		console.log("Socket OnConnect", "Not Initialised");

		initialised = true;
	}
});

socket.on("disconnect", function (param)
{
	console.log("Socket OnDisconnect", param);

	Messaging.BroadcastReceived({
		Username: "",
		Message: "Connection dropped, will reconnect when server is available.",
		Type: SendTypes.Text,
		Timestamp: Helpers.GetTimestamp(),
		MessageId: Helpers.GetNewMessageId()
	});
});

socket.on("error", function (param) { console.log("Socket OnError", param); });
socket.on("reconnect", function (param) { console.log("Socket OnReconnect", param); });
socket.on("reconnect_attempt", function (param) { console.log("Socket OnReconnectAttempt", param); });
socket.on("reconnecting", function (param) { console.log("Socket OnReconnecting", param); });
socket.on("reconnect_error", function (param) { console.log("Socket OnReconnectError", param); });
socket.on("reconnect_failed", function (param) { console.log("Socket OnReconnectFailed", param); });

var is = function (v) { return Settings.Username == v; }