const express = require('express')
const app = express()
const bodyParser = require('body-parser')
var sig = require('./sig');
var config = {
    "sdk_appid": 1400067783,
    "expire_after": 180 * 24 * 3600,
    "private_key": "./keys/private_key",
    "public_key": "./keys/public_key"
}

var sig = new sig.Sig(config);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// 接口
app.post('/login', (req, res) => {
	const bodyData = req.body
	if (bodyData.username === '1' && bodyData.password === '1') {
		const identifier = 'yezi'
		res.send({
			code: 0,
			msg: '成功',
			identifier: identifier,
			sig: sig.genSig(identifier)
		})
	} else if (bodyData.username === '2' && bodyData.password === '2') {
		const identifier = 'xiaoming'
		res.send({
			code: 0,
			msg: '成功',
			identifier: identifier,
			sig: sig.genSig(identifier)
		})
	} else {
		res.send({
			code: 1001,
			msg: '账号密码错误'
		})
	}
})

app.post('/sig', (req, res) => {
	const identifier = req.body.identifier
	console.log(identifier)
	res.send({
		sig: sig.genSig(identifier)
	})
})

// 监听
app.listen(5000, () => {
	console.log('The server is running at port 5000')
})