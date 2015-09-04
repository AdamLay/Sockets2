function index(req, res) {
    var ua = req.header('user-agent');
    console.log(ua);
    if (/mobile/i.test(ua))
        res.render('index-mobile', { title: 'Sockets' });
    else
        res.render('index', { title: 'Sockets' });
}
exports.index = index;
;
