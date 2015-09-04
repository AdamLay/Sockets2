/*
 * GET home page.
 */
import express = require('express');

export function index(req: express.Request, res: express.Response)
{
	var ua = req.header('user-agent');

	console.log(ua);

	if (/mobile/i.test(ua))
		res.render('index-mobile', { title: 'Sockets' });
	else
		res.render('index', { title: 'Sockets' });
};