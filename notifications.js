/*
 * display a non intrusive notification window.
 *
 * usage: Notifications.notify(title, format, format_arguments)
 *
 * inspired by http://extjs.com/deploy/dev/examples/shared/examples.js
 *
 * Author : Karl Forner
 */

var Notifications = {
	DIV_ID : 'notification-div'
};

Notifications._createBox = function(t, s) {
	return [
			'<div class="msg">',
			'<div class="x-box-tl"><div class="x-box-tr"><div class="x-box-tc"></div></div></div>',
			'<div class="x-box-ml"><div class="x-box-mr"><div class="x-box-mc"><h3>',
			t,
			'</h3>',
			s,
			'</div></div></div>',
			'<div class="x-box-bl"><div class="x-box-br"><div class="x-box-bc"></div></div></div>',
			'</div>' ].join('');
};

Notifications.notify = function(title, format) {
	// create the DOM div element that will hold the message box
	if (!Notifications._div) {
		Notifications._div = Ext.DomHelper.insertFirst(document.body, {
			id: Notifications.DIV_ID,
			style:"position:absolute;width:250px;left:35%;top:10px;z-index:20000;"
		}, true);
	}
	var msgCt = Notifications._div;
	msgCt.alignTo(document, 't-t');
	var s = String.format.apply(String, Array.prototype.slice
			.call(arguments, 1));
	var m = Ext.DomHelper.append(msgCt, {
		html : Notifications._createBox(title, s)
	}, true);
	m.slideIn('t').pause(1).ghost("t", {
		remove : true
	});
};
